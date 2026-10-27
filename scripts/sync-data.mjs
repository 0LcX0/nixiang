#!/usr/bin/env node
// 从公开数据源同步模型榜单数据，输出到 src/data/ 下的 JSON 文件。
// 数据来源：
//   - LMArena 官方排行榜数据集（CC-BY-4.0）
//   - OpenRouter 公开模型 API（价格与规格）
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "src/data");

const LMA_DATASET = "lmarena-ai/leaderboard-dataset";
const LMA_CONFIG = "text";
const LMA_SPLIT = "latest";
const PAGE_SIZE = 100;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/models";

const WANTED_CATEGORIES = {
  overall: "综合",
  chinese: "中文",
  coding: "编程",
  creative_writing: "创意写作",
  hard_prompts: "高难度",
  expert: "专家任务",
  english: "英文",
  industry_business_and_management_and_financial_operations: "金融与商业",
};

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "nixiang-leaderboard/1.0" },
      signal: AbortSignal.timeout(45_000),
    });
    if (res.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 6) throw err;
    // 数据集服务对连续请求限流，退避等待后重试
    const wait = err.message === "RATE_LIMIT" ? 10_000 * attempt : 1_500 * attempt;
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(url, attempt + 1);
  }
}

async function fetchLmArena() {
  const base = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(
    LMA_DATASET,
  )}&config=${LMA_CONFIG}&split=${LMA_SPLIT}`;

  const first = await fetchJson(`${base}&offset=0&length=${PAGE_SIZE}`);
  const total = first.num_rows_total ?? 0;
  const rows = [...(first.rows ?? []).map((r) => r.row)];

  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
    const page = await fetchJson(`${base}&offset=${offset}&length=${PAGE_SIZE}`);
    rows.push(...(page.rows ?? []).map((r) => r.row));
    process.stderr.write(`\r  已获取 ${Math.min(offset + PAGE_SIZE, total)}/${total} 行`);
    await new Promise((r) => setTimeout(r, 250));
  }
  process.stderr.write("\n");

  const publishDate = rows
    .map((r) => r.leaderboard_publish_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  return { rows, publishDate, total };
}

async function fetchOpenRouter() {
  const json = await fetchJson(OPENROUTER_URL);
  const map = new Map();

  for (const m of json.data ?? []) {
    const prompt = Number(m.pricing?.prompt ?? 0);
    const completion = Number(m.pricing?.completion ?? 0);
    // m.name 形如 "OpenAI: GPT-5.5"，去掉厂商前缀后才是可与排行榜比对的模型名
    const cleanName = (m.name ?? "").replace(/^[^:]+:\s*/, "");
    // OpenRouter 价格单位是「每 token 美元」，乘 1e6 转成「每百万 token」，
    // 再收敛到 4 位小数，避免浮点乘法的长尾误差
    const roundPrice = (v) => Math.round(v * 1e6 * 1e4) / 1e4;
    map.set(normalizeName(cleanName), {
      id: m.id,
      name: cleanName,
      vendor: (m.id ?? "").split("/")[0],
      contextLength: m.context_length ?? null,
      promptPrice: Number.isFinite(prompt) ? roundPrice(prompt) : null,
      completionPrice: Number.isFinite(completion) ? roundPrice(completion) : null,
      reasoning: Boolean(m.reasoning),
      huggingFaceId: m.hugging_face_id || null,
    });
  }
  return map;
}

// LMArena 的模型名带 "(High)" 这类推理档位后缀，OpenRouter 的更简洁。
// 这里生成一个宽松的归一化键用来做模糊匹配。
function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

// 一个模型常有多条 OpenRouter 记录（batch 版、日期快照版等）。
// 按 精确 → 去日期后缀 → 前缀 的顺序挑选，避免 "GPT-5.5" 误配到 "GPT-5.5 Pro"。
function resolveOpenRouter(orMap, orEntriesByKey, name) {
  const key = normalizeName(name);
  if (!key) return null;

  const exact = orMap.get(key);
  if (exact) return exact;

  // 去掉尾部的日期数字（如 deepseekv41flash1017 里的 1017）
  const stripDate = key.replace(/\d{4}$/, "");
  const stripped = orMap.get(stripDate);
  if (stripped) return stripped;

  // 前缀匹配：取最短的那个，倾向更通用的模型名
  const candidates = orEntriesByKey.filter((e) => e.key.startsWith(key) && e.key !== key);
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.key.length - b.key.length);
    return candidates[0].entry;
  }

  return null;
}

const VENDOR_LABELS = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  "meta-llama": "Meta",
  alibaba: "阿里巴巴",
  qwen: "阿里巴巴",
  deepseek: "深度求索",
  moonshot: "月之暗面",
  moonshotai: "月之暗面",
  xiaomi: "小米",
  zai: "智谱 AI",
  "z-ai": "智谱 AI",
  minimax: "MiniMax",
  bytedance: "字节跳动",
  baidu: "百度",
  tencent: "腾讯",
  meituan: "美团",
  stepfun: "阶跃星辰",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  mistral: "Mistral",
  "mistralai": "Mistral",
  cohere: "Cohere",
  amazon: "Amazon",
  "ant-group": "蚂蚁集团",
  ibm: "IBM",
  xai: "xAI",
  "inception-ai": "Inception AI",
  reflection: "Reflection",
  thinky: "Thinky",
  upstage: "Upstage",
  allenai: "Allen Institute",
};

function labelFor(vendor) {
  return VENDOR_LABELS[vendor] ?? vendor;
}

function cleanModelName(name) {
  return String(name ?? "").trim();
}

async function main() {
  console.log("同步 LMArena 排行榜…");
  const { rows, publishDate, total } = await fetchLmArena();
  console.log(`  ✓ ${rows.length} 行（数据源声明 ${total} 行），更新日期 ${publishDate}`);

  console.log("同步 OpenRouter 模型价格…");
  const orMap = await fetchOpenRouter();
  const orEntriesByKey = [...orMap.entries()].map(([key, entry]) => ({ key, entry }));
  console.log(`  ✓ ${orMap.size} 个模型`);

  // 每个分类各生成一个榜单
  const boards = {};
  for (const [key, label] of Object.entries(WANTED_CATEGORIES)) {
    const entries = rows
      .filter((r) => r.category === key && Number.isFinite(Number(r.rank)))
      .sort((a, b) => Number(a.rank) - Number(b.rank))
      .map((r) => {
        const name = cleanModelName(r.model_name);
        const or = resolveOpenRouter(orMap, orEntriesByKey, name);
        return {
          rank: Math.round(Number(r.rank)),
          name,
          vendor: r.organization ?? "",
          vendorLabel: labelFor(r.organization ?? ""),
          elo: Number(Number(r.rating).toFixed(1)),
          eloLower: Number(Number(r.rating_lower).toFixed(1)),
          eloUpper: Number(Number(r.rating_upper).toFixed(1)),
          votes: Math.round(Number(r.vote_count ?? 0)),
          license: r.license ?? null,
          openWeights: String(r.license ?? "").toLowerCase() !== "proprietary",
          contextLength: or?.contextLength ?? null,
          promptPrice: or?.promptPrice ?? null,
          completionPrice: or?.completionPrice ?? null,
          reasoning: or?.reasoning ?? null,
          matched: Boolean(or),
        };
      });

    if (entries.length > 0) {
      boards[key] = { key, label, entries };
      console.log(`  ✓ ${label}榜：${entries.length} 个模型`);
    }
  }

  // 用综合榜导出全部模型的基础信息，供详情页使用
  const allModels = {};
  for (const r of rows) {
    if (r.category !== "overall") continue;
    const name = cleanModelName(r.model_name);
    if (!name || allModels[name]) continue;
    const or = resolveOpenRouter(orMap, orEntriesByKey, name);
    allModels[name] = {
      slug: slugify(name),
      name,
      vendor: r.organization ?? "",
      vendorLabel: labelFor(r.organization ?? ""),
      license: r.license ?? null,
      openWeights: String(r.license ?? "").toLowerCase() !== "proprietary",
      contextLength: or?.contextLength ?? null,
      promptPrice: or?.promptPrice ?? null,
      completionPrice: or?.completionPrice ?? null,
      reasoning: or?.reasoning ?? null,
      huggingFaceId: or?.huggingFaceId ?? null,
      elo: Number(Number(r.rating).toFixed(1)),
      votes: Math.round(Number(r.vote_count ?? 0)),
    };
  }

  const venders = [...new Set(Object.values(allModels).map((m) => m.vendor))].sort();

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      leaderboardDate: publishDate ?? null,
      totalRows: rows.length,
      modelCount: Object.keys(allModels).length,
      vendorCount: venders.length,
      sources: [
        {
          name: "LMArena",
          url: "https://lmarena.ai",
          license: "CC-BY-4.0",
          description: "人类盲测对战 Elo 评分与排名",
        },
        {
          name: "OpenRouter",
          url: "https://openrouter.ai",
          description: "模型定价、上下文窗口与规格信息",
        },
      ],
    },
    boards,
    models: allModels,
    vendors: venders.map((v) => ({ id: v, label: labelFor(v) })),
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, "leaderboard.json"), JSON.stringify(payload, null, 2) + "\n");

  console.log(`\n✓ 已写入 src/data/leaderboard.json`);
  console.log(`  模型 ${payload.meta.modelCount} 个 / 厂商 ${payload.meta.vendorCount} 家 / 榜单 ${Object.keys(boards).length} 个`);
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

main().catch((err) => {
  console.error("\n同步失败:", err.message);
  process.exit(1);
});

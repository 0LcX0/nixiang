import raw from "@/data/leaderboard.json";

export type BoardKey =
  | "overall"
  | "chinese"
  | "coding"
  | "creative_writing"
  | "hard_prompts"
  | "expert"
  | "english"
  | "industry_business_and_management_and_financial_operations";

export interface BoardEntry {
  rank: number;
  name: string;
  vendor: string;
  vendorLabel: string;
  elo: number;
  eloLower: number;
  eloUpper: number;
  votes: number;
  license: string | null;
  openWeights: boolean;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
  reasoning: boolean | null;
  matched: boolean;
}

export interface ModelSummary {
  slug: string;
  name: string;
  vendor: string;
  vendorLabel: string;
  license: string | null;
  openWeights: boolean;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
  reasoning: boolean | null;
  huggingFaceId: string | null;
  elo: number;
  votes: number;
}

export interface Board {
  key: string;
  label: string;
  entries: BoardEntry[];
}

export interface DataSource {
  name: string;
  url: string;
  license?: string;
  description: string;
}

export interface Dataset {
  meta: {
    generatedAt: string;
    leaderboardDate: string | null;
    totalRows: number;
    modelCount: number;
    vendorCount: number;
    sources: DataSource[];
  };
  boards: Record<string, Board>;
  models: Record<string, ModelSummary>;
  vendors: { id: string; label: string }[];
}

export const dataset = raw as unknown as Dataset;

export const boardKeys = Object.keys(dataset.boards);

export function getBoard(key: string): Board | null {
  return dataset.boards[key] ?? null;
}

export function getAllModels(): ModelSummary[] {
  return Object.values(dataset.models);
}

export function getModelBySlug(slug: string): ModelSummary | null {
  return getAllModels().find((m) => m.slug === slug) ?? null;
}

/** 计算某个模型在所有榜单中的名次，用于详情页展示 */
export function getModelRanks(name: string) {
  return Object.values(dataset.boards)
    .map((board) => {
      const entry = board.entries.find((e) => e.name === name);
      return entry ? { key: board.key, label: board.label, rank: entry.rank, elo: entry.elo, total: board.entries.length } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.rank - b.rank);
}

/** 综合价格（输入 + 输出各占一半）用于性价比排序 */
export function blendedPrice(m: { promptPrice: number | null; completionPrice: number | null }): number | null {
  if (m.promptPrice == null || m.completionPrice == null) return null;
  return m.promptPrice * 0.25 + m.completionPrice * 0.75;
}

export function formatPrice(v: number | null): string {
  if (v == null) return "—";
  if (v === 0) return "免费";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(2)}`;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

export function formatContext(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

export function formatNumber(v: number): string {
  if (v >= 10_000) return `${(v / 10_000).toFixed(1)}万`;
  return v.toLocaleString("zh-CN");
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

const LICENSE_LABELS: Record<string, string> = {
  proprietary: "专有许可",
  apache: "Apache 2.0",
  "apache-2.0": "Apache 2.0",
  mit: "MIT",
  "llama": "Llama 社区许可",
  "llama2": "Llama 2 社区许可",
  "llama3": "Llama 3 社区许可",
  "llama3.1": "Llama 3.1 社区许可",
  "llama4": "Llama 4 社区许可",
  "gemma": "Gemma 许可",
  "cc-by-4.0": "CC BY 4.0",
  "cc-by-nc-4.0": "CC BY-NC 4.0",
  "openrail": "OpenRAIL",
  "deepseek": "DeepSeek 许可",
  "qwen": "Qwen 许可",
  "other": "其他",
  unknown: "未标注",
};

export function formatLicense(license: string | null): string {
  if (!license) return "未标注";
  const key = license.toLowerCase().trim();
  if (LICENSE_LABELS[key]) return LICENSE_LABELS[key];
  // 形如 "llama3.1" 的变体，退回到前缀匹配
  for (const [k, v] of Object.entries(LICENSE_LABELS)) {
    if (key.startsWith(k)) return v;
  }
  return license;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  blendedPrice,
  dataset,
  formatContext,
  formatLicense,
  formatNumber,
  formatPrice,
  getAllModels,
  getModelBySlug,
  getModelRanks,
} from "@/lib/data";

export function generateStaticParams() {
  return getAllModels().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: "模型未找到" };
  return {
    title: `${model.name} 排名与价格`,
    description: `${model.name}（${model.vendorLabel}）在 LMArena 各榜单中的排名、Elo 评分、上下文窗口与调用价格。`,
  };
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const ranks = getModelRanks(model.name);
  const overall = ranks.find((r) => r.key === "overall");
  const price = blendedPrice(model);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/" className="text-[12.5px] text-ink-500 hover:text-accent-400">
        ← 返回榜单
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-semibold tracking-tight">{model.name}</h1>
            <span
              className={`rounded px-2 py-0.5 text-[11.5px] ${
                model.openWeights
                  ? "bg-teal-400/10 text-teal-400"
                  : "bg-ink-800 text-ink-400"
              }`}
            >
              {model.openWeights ? "开放权重" : "闭源"}
            </span>
          </div>
          <p className="mt-2 text-[13.5px] text-ink-400">
            {model.vendorLabel}
            {model.reasoning && <span className="ml-2 text-ink-500">· 推理模型</span>}
            {model.license && (
              <span className="ml-2 text-ink-500">· {formatLicense(model.license)}</span>
            )}
          </p>
        </div>

        {overall && (
          <div className="rounded-xl border border-ink-800 bg-ink-900 px-6 py-4 text-center">
            <div className="text-[11.5px] text-ink-500">综合排名</div>
            <div className="tabular mt-1 text-[28px] font-semibold text-gold-400">
              #{overall.rank}
            </div>
            <div className="text-[11.5px] text-ink-400 tabular">
              共 {overall.total} 个模型
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="综合 Elo" value={model.elo.toFixed(0)} hint={`${formatNumber(model.votes)} 次投票`} />
        <Metric
          label="输入价格"
          value={model.promptPrice != null ? `${formatPrice(model.promptPrice)}/M` : "—"}
          hint="每百万 token"
        />
        <Metric
          label="输出价格"
          value={model.completionPrice != null ? `${formatPrice(model.completionPrice)}/M` : "—"}
          hint="每百万 token"
        />
        <Metric
          label="上下文窗口"
          value={formatContext(model.contextLength)}
          hint="tokens"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold text-ink-200">各榜单排名</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-ink-800">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900 text-[11.5px] uppercase tracking-wide text-ink-500">
                <th className="px-3 py-2.5 text-left font-medium">榜单</th>
                <th className="px-3 py-2.5 text-right font-medium">排名</th>
                <th className="px-3 py-2.5 text-right font-medium">Elo</th>
                <th className="px-3 py-2.5 text-right font-medium">参评模型数</th>
                <th className="w-40 px-3 py-2.5 text-left font-medium">相对位置</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r) => {
                const pct = ((r.total - r.rank) / r.total) * 100;
                return (
                  <tr key={r.key} className="border-b border-ink-850 last:border-0">
                    <td className="px-3 py-2.5">
                      <Link href={`/?board=${r.key}`} className="text-ink-100 hover:text-accent-400">
                        {r.label}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular font-medium">{r.rank}</td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-300">{r.elo.toFixed(0)}</td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-500">{r.total}</td>
                    <td className="px-3 py-2.5">
                      <span className="relative block h-1.5 overflow-hidden rounded-full bg-ink-800">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-accent-500"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {ranks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-ink-500">
                    该模型未出现在任何榜单中
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {price != null && (
        <section className="mt-10">
          <h2 className="text-[15px] font-semibold text-ink-200">性价比参考</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-400">
            按输入占 25%、输出占 75% 加权，综合价格约为{" "}
            <span className="text-ink-100 tabular">${price.toFixed(3)}</span> / 百万 token，
            每 1 分 Elo 的成本约{" "}
            <span className="text-ink-100 tabular">
              ${(price / Math.max(model.elo - 1000, 1)).toFixed(4)}
            </span>
            。Elo 以 1000 为基准分，这里用「高于基准的分数」作为能力增量。
          </p>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-ink-800 bg-ink-900/50 p-5">
        <h2 className="text-[13px] font-semibold text-ink-200">数据说明</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">
          Elo 评分与排名来自 LMArena 盲测数据集（CC-BY-4.0，更新于{" "}
          {dataset.meta.leaderboardDate}）。价格为 OpenRouter 公开目录中的每百万 token
          美元价格，可能随厂商调价变动。票数低于 1000 时排名置信度较低。
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
      <div className="text-[11.5px] text-ink-500">{label}</div>
      <div className="tabular mt-1 text-[19px] font-semibold text-ink-100">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-500">{hint}</div>
    </div>
  );
}

import Link from "next/link";
import {
  blendedPrice,
  dataset,
  formatContext,
  formatPrice,
  getAllModels,
} from "@/lib/data";

export const metadata = {
  title: "性价比榜",
  description: "按「每分 Elo 的成本」排序，找出能力与价格的最优组合。",
};

export default function ValuePage() {
  const models = getAllModels()
    .map((m) => {
      const price = blendedPrice(m);
      if (price == null || price <= 0) return null;
      // Elo 以 1000 为基准，用超出基准的分数衡量「能力增量」，避免高分模型被
      // 基准分稀释掉成本差异
      const ability = Math.max(m.elo - 1000, 1);
      return { ...m, price, ability, costPerPoint: price / ability };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.costPerPoint - b.costPerPoint);

  const best = models.slice(0, 30);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-[24px] font-semibold tracking-tight">性价比榜</h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-400">
        把「能力」除以「价格」，找出花最少的钱买到最多能力的模型。共 {models.length}{" "}
        个模型有完整价格数据。
      </p>

      <div className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 p-4 text-[12.5px] leading-relaxed text-ink-400">
        <span className="text-ink-200">计算方式：</span>
        综合价格 = 输入价 × 25% + 输出价 × 75%（多数对话场景输出 token 更多）；
        能力增量 = Elo − 1000；性价比 = 综合价格 ÷ 能力增量，数值越小越划算。
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-ink-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900 text-[11.5px] uppercase tracking-wide text-ink-500">
                <th className="w-14 px-3 py-2.5 text-right font-medium">序号</th>
                <th className="px-3 py-2.5 text-left font-medium">模型</th>
                <th className="px-3 py-2.5 text-left font-medium">厂商</th>
                <th className="w-20 px-3 py-2.5 text-right font-medium">Elo</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">综合价格</th>
                <th className="w-32 px-3 py-2.5 text-right font-medium">每分 Elo 成本</th>
                <th className="w-24 px-3 py-2.5 text-right font-medium">上下文</th>
                <th className="w-20 px-3 py-2.5 text-center font-medium">权重</th>
              </tr>
            </thead>
            <tbody>
              {best.map((m, i) => (
                <tr key={m.slug} className="border-b border-ink-850 last:border-0 hover:bg-ink-900/60">
                  <td className="px-3 py-2.5 text-right tabular text-ink-500">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/models/${m.slug}`} className="font-medium text-ink-100 hover:text-accent-400">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-ink-400">{m.vendorLabel}</td>
                  <td className="px-3 py-2.5 text-right tabular">{m.elo.toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-right tabular text-ink-300">
                    {formatPrice(m.price)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-teal-400">
                    ${m.costPerPoint.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-ink-400">
                    {formatContext(m.contextLength)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {m.openWeights ? (
                      <span className="rounded bg-teal-400/10 px-1.5 py-0.5 text-[11px] text-teal-400">
                        开源
                      </span>
                    ) : (
                      <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[11px] text-ink-400">
                        闭源
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-600">
        仅展示前 30 名。价格为 OpenRouter 公开目录快照（{dataset.meta.leaderboardDate}
        ），实际计费以厂商官网为准。低价模型的绝对能力可能明显弱于顶级模型，性价比高不等于更好用。
      </p>
    </div>
  );
}

import Link from "next/link";
import ChartCard from "@/components/ChartCard";
import BarChart from "@/components/charts/BarChart";
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
      const ability = Math.max(m.elo - 1000, 1);
      return { ...m, price, ability, costPerPoint: price / ability };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.costPerPoint - b.costPerPoint);

  const best = models.slice(0, 30);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <h1 className="font-display text-[36px] leading-tight text-ink">性价比榜</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
        把能力除以价格，找出花最少的钱买到最多能力的模型。共 {models.length}{" "}
        个模型有完整价格数据。
      </p>

      <div className="mt-6 max-w-2xl rounded-lg border border-line bg-mist p-4 text-[12.5px] leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">计算方式：</span>
        综合价格 = 输入价 × 25% + 输出价 × 75%（多数对话场景输出 token 更多）；
        能力增量 = Elo − 1000；性价比 = 综合价格 ÷ 能力增量，数值越小越划算。
      </div>

      <section className="mt-8">
        <ChartCard
          title="每分 Elo 成本"
          subtitle="排名前 20 的模型，柱高表示每提升 1 分 Elo 需要付出的美元成本。"
        >
          <BarChart
            data={best.slice(0, 20).map((m) => ({
              label: m.name,
              value: Number(m.costPerPoint.toFixed(4)),
              color: m.openWeights ? "#16a34a" : "#4f7cf7",
            }))}
            height={360}
            maxBars={20}
            format="price"
          />
        </ChartCard>
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-4 text-[24px] text-ink">完整排名</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="w-14 px-3 py-2.5 text-right font-medium">序号</th>
                  <th className="px-3 py-2.5 text-left font-medium">模型</th>
                  <th className="px-3 py-2.5 text-left font-medium">厂商</th>
                  <th className="w-16 px-3 py-2.5 text-right font-medium">Elo</th>
                  <th className="w-24 px-3 py-2.5 text-right font-medium">综合价格</th>
                  <th className="w-28 px-3 py-2.5 text-right font-medium">每分 Elo</th>
                  <th className="w-20 px-3 py-2.5 text-right font-medium">上下文</th>
                  <th className="w-16 px-3 py-2.5 text-center font-medium">权重</th>
                </tr>
              </thead>
              <tbody>
                {best.map((m, i) => (
                  <tr key={m.slug} className="border-b border-line last:border-0 hover:bg-mist/60">
                    <td className="px-3 py-2 text-right tabular text-ink-faint">{i + 1}</td>
                    <td className="px-3 py-2">
                      <Link href={`/models/${m.slug}`} className="text-ink hover:text-brand">
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{m.vendorLabel}</td>
                    <td className="px-3 py-2 text-right tabular">{m.elo.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right tabular text-ink-soft">
                      {formatPrice(m.price)}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-green-700">
                      ${m.costPerPoint.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-ink-muted">
                      {formatContext(m.contextLength)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10.5px] ${
                          m.openWeights
                            ? "bg-green-50 text-green-700"
                            : "bg-mist text-ink-muted"
                        }`}
                      >
                        {m.openWeights ? "开源" : "闭源"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
          仅展示前 30 名。价格为 OpenRouter 公开目录快照（{dataset.meta.leaderboardDate}
          ），实际计费以厂商官网为准。
        </p>
      </section>
    </div>
  );
}

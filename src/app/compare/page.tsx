import CompareClient from "./CompareClient";
import { boardKeys, dataset, getAllModels, getModelRanks } from "@/lib/data";

export const metadata = {
  title: "模型对比",
  description: "横向对比多个大模型的 Elo 评分、价格、上下文窗口与各榜单排名。",
};

export default function ComparePage() {
  const models = getAllModels();
  const ranksByName: Record<string, { key: string; label: string; rank: number; total: number }[]> = {};
  for (const m of models) {
    ranksByName[m.name] = getModelRanks(m.name).map((r) => ({
      key: r.key,
      label: r.label,
      rank: r.rank,
      total: r.total,
    }));
  }

  const boardLabels = boardKeys.map((k) => ({ key: k, label: dataset.boards[k].label }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <h1 className="font-display text-[36px] leading-tight text-ink">模型对比</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
        从 {models.length} 个模型中任选最多 4 个，逐项对比能力评分、调用成本与规格。
      </p>
      <div className="mt-7">
        <CompareClient models={models} ranksByName={ranksByName} boardLabels={boardLabels} />
      </div>
    </div>
  );
}

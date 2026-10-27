import Link from "next/link";
import BarChart from "@/components/charts/BarChart";
import ScatterChart from "@/components/charts/ScatterChart";
import ChartCard from "@/components/ChartCard";
import ModelTable from "@/components/ModelTable";
import SectionNav from "@/components/SectionNav";
import {
  boardKeys,
  dataset,
  formatContext,
  formatDate,
  formatPrice,
  getAllModels,
  blendedPrice,
} from "@/lib/data";

const SECTIONS = [
  { id: "overview", label: "总览" },
  { id: "intelligence", label: "能力评分" },
  { id: "boards", label: "分维度榜单" },
  { id: "cost", label: "成本" },
  { id: "context", label: "上下文窗口" },
  { id: "value", label: "性价比" },
  { id: "table", label: "完整榜单" },
];

export default function Home() {
  const overall = dataset.boards.overall.entries;
  const models = getAllModels();

  // 摘要卡片用的极值
  const top3 = overall.slice(0, 3);
  const openTop = overall.find((e) => e.openWeights);
  const priced = overall.filter((e) => e.promptPrice != null && e.promptPrice > 0);
  const cheapest = priced.length
    ? priced.reduce((a, b) => (a.promptPrice! <= b.promptPrice! ? a : b))
    : null;
  const maxCtx = [...overall].sort(
    (a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0),
  )[0];

  // 能力评分柱状图：取前 34
  const intelBars = overall.slice(0, 34).map((e) => ({
    label: e.name,
    value: e.elo,
    highlight: e.openWeights,
    color: e.openWeights ? "#16a34a" : "#4f7cf7",
  }));

  // 成本柱状图：每百万输出 token 价格，取最便宜的 28 个有价格的
  const costBars = [...priced]
    .sort((a, b) => a.completionPrice! - b.completionPrice!)
    .slice(0, 28)
    .map((e) => ({
      label: e.name,
      value: e.completionPrice as number,
      color: "#ea580c",
    }));

  // 上下文柱状图
  const ctxBars = [...overall]
    .filter((e) => e.contextLength != null)
    .sort((a, b) => (b.contextLength as number) - (a.contextLength as number))
    .slice(0, 28)
    .map((e) => ({
      label: e.name,
      value: Math.round((e.contextLength as number) / 1000),
      color: "#0891b2",
    }));

  // 能力 vs 价格散点
  const scatter = priced
    .slice(0, 160)
    .map((e) => ({
      name: e.name,
      x: e.promptPrice as number,
      y: e.elo,
      highlight: e.openWeights,
    }));

  // 性价比计算
  const valueTop = models
    .map((m) => {
      const price = blendedPrice(m);
      if (price == null || price <= 0) return null;
      const ability = Math.max(m.elo - 1000, 1);
      return { name: m.name, costPerPoint: price / ability, elo: m.elo };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.costPerPoint - b.costPerPoint)
    .slice(0, 24);

  return (
    <>
      {/* Hero：灰底大标题 + 摘要卡片 */}
      <section className="bg-mist pt-12 pb-10">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-display max-w-3xl text-[36px] leading-[1.15] text-ink">
                大模型能力对比：智能、性能与价格分析
              </h1>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-soft">
                点击任意模型查看详细指标。本站汇总 {dataset.meta.modelCount} 个模型、
                {dataset.meta.vendorCount} 家厂商的公开盲测数据，数据更新于{" "}
                {formatDate(dataset.meta.leaderboardDate)}。
              </p>
            </div>
            <Link
              href="/methodology"
              className="shrink-0 rounded-full bg-brand px-4 py-2 text-[13px] text-white transition-opacity hover:opacity-90"
            >
              查看方法论 ↗
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <SummaryCard
              title="综合能力"
              body={
                <>
                  综合评分最高的模型是{" "}
                  <strong className="font-medium text-ink">{top3[0]?.name}</strong>
                  ，其后为{" "}
                  <strong className="font-medium text-ink">{top3[1]?.name}</strong> 与{" "}
                  <strong className="font-medium text-ink">{top3[2]?.name}</strong>。
                </>
              }
            />
            <SummaryCard
              title="开源最强"
              body={
                <>
                  <strong className="font-medium text-ink">{openTop?.name ?? "—"}</strong>{" "}
                  是开放权重模型中的第一名，Elo {openTop?.elo.toFixed(0) ?? "—"}，
                  高于约 {percentile(overall, openTop?.rank)} 的模型。
                </>
              }
            />
            <SummaryCard
              title="最低价格"
              body={
                <>
                  <strong className="font-medium text-ink">{cheapest?.name ?? "—"}</strong>{" "}
                  的输入价格为 {formatPrice(cheapest?.promptPrice ?? null)} / 百万 token，
                  是收录模型中最便宜的选项。
                </>
              }
            />
            <SummaryCard
              title="最大上下文"
              body={
                <>
                  <strong className="font-medium text-ink">{maxCtx?.name ?? "—"}</strong>{" "}
                  支持 {formatContext(maxCtx?.contextLength ?? null)} tokens，
                  适合长文档与代码库分析。
                </>
              }
            />
            <SummaryCard
              title="投票样本"
              body={
                <>
                  全部收录模型累计获得{" "}
                  <strong className="font-medium text-ink">{formatVotes(overall)}</strong>{" "}
                  次人类盲测投票，样本量越大排名越稳定。
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* 三栏图表速览 */}
      <section className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard
            title="能力评分"
            subtitle="LMArena 盲测 Elo 分数 · 越高越好"
          >
            <BarChart data={intelBars.slice(0, 6)} height={300} maxBars={6} />
          </ChartCard>
          <ChartCard
            title="输出价格"
            subtitle="每百万输出 token 的美元价格 · 越低越好"
          >
            <BarChart
              data={costBars.slice(0, 6)}
              height={300}
              maxBars={6}
              format="price"
            />
          </ChartCard>
          <ChartCard
            title="上下文窗口"
            subtitle="最大输入输出总长度 · 越大越好"
          >
            <BarChart
              data={ctxBars.slice(0, 6)}
              height={300}
              maxBars={6}
              valueSuffix="K"
            />
          </ChartCard>
        </div>
      </section>

      {/* 正文：左侧导航 + 内容 */}
      <div className="mx-auto flex max-w-[1400px] gap-8 px-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <SectionNav sections={SECTIONS} />
        </aside>

        <div className="min-w-0 flex-1 space-y-8 pb-8">
          <section id="overview" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">总览</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="收录模型" value={String(dataset.meta.modelCount)} hint="个" />
              <StatTile label="覆盖厂商" value={String(dataset.meta.vendorCount)} hint="家" />
              <StatTile label="榜单维度" value={String(boardKeys.length)} hint="个" />
            </div>
          </section>

          <section id="intelligence" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">能力评分</h2>
            <ChartCard
              title="综合能力排名"
              subtitle="LMArena 综合榜 Elo 评分，来自人类盲测两两对战的 Bradley-Terry 模型换算。绿色为开放权重模型。"
              note="票数低于 1000 的模型置信区间较宽，名次可能波动。"
            >
              <BarChart data={intelBars} height={400} maxBars={34} />
            </ChartCard>
          </section>

          <section id="boards" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">分维度榜单</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {boardKeys
                .filter((k) => k !== "overall")
                .map((k) => {
                  const b = dataset.boards[k];
                  const top = b.entries.slice(0, 5);
                  return (
                    <ChartCard
                      key={k}
                      title={`${b.label}榜`}
                      subtitle={`${b.entries.length} 个模型参评`}
                    >
                      <ol className="space-y-2">
                        {top.map((e) => (
                          <li key={`${k}-${e.rank}`} className="flex items-baseline gap-3 text-[13px]">
                            <span className="w-4 shrink-0 tabular text-ink-faint">{e.rank}</span>
                            <Link
                              href={`/models/${slugOf(e.name)}`}
                              className="min-w-0 flex-1 truncate text-ink hover:text-brand"
                            >
                              {e.name}
                            </Link>
                            <span className="shrink-0 tabular text-[12px] text-ink-muted">
                              {e.elo.toFixed(0)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </ChartCard>
                  );
                })}
            </div>
          </section>

          <section id="cost" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">成本</h2>
            <div className="grid gap-4">
              <ChartCard
                title="能力与输入价格分布"
                subtitle="横轴为每百万输入 token 的美元价格（对数刻度），纵轴为综合 Elo。左上角区域代表「高能力、低价格」。"
                note="仅展示 OpenRouter 可查到价格的模型；约半数模型因命名不匹配未收录价格。"
              >
                <ScatterChart
                  data={scatter}
                  xLabel="输入价格（美元 / 百万 token）"
                  yLabel="综合 Elo"
                  logX
                  format="price"
                />
              </ChartCard>

              <ChartCard
                title="输出价格对比"
                subtitle="每百万输出 token 的价格，按从低到高排列。输出价格通常远高于输入价格，是实际成本的主要部分。"
              >
                <BarChart
                  data={costBars}
                  height={360}
                  maxBars={28}
                  format="price"
                />
              </ChartCard>
            </div>
          </section>

          <section id="context" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">上下文窗口</h2>
            <ChartCard
              title="最大上下文长度"
              subtitle="单次请求可容纳的最大 token 数（单位：千）。上下文越大，越能处理长文档、长对话与大型代码库。"
            >
              <BarChart data={ctxBars} height={360} maxBars={28} valueSuffix="K" />
            </ChartCard>
          </section>

          <section id="value" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">性价比</h2>
            <ChartCard
              title="每分 Elo 成本"
              subtitle="综合价格 ÷（Elo − 1000），数值越低越划算。综合价格按输入 25%、输出 75% 加权。"
              note="低价模型的绝对能力可能明显弱于顶级模型，性价比高不等于更好用。"
              actions={
                <Link href="/value" className="text-[12.5px] text-brand hover:underline">
                  完整性价比榜 →
                </Link>
              }
            >
              <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {valueTop.map((v, i) => (
                  <li key={v.name} className="flex items-baseline gap-3 text-[13px]">
                    <span className="w-5 shrink-0 tabular text-ink-faint">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{v.name}</span>
                    <span className="shrink-0 tabular text-[12px] text-ink-muted">
                      ${v.costPerPoint.toFixed(4)}
                    </span>
                  </li>
                ))}
              </ol>
            </ChartCard>
          </section>

          <section id="table" className="scroll-mt-20">
            <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">完整榜单</h2>
            <ModelTable entries={overall} />
          </section>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="rounded-full bg-mist px-2.5 py-1 text-[11.5px] text-ink-soft inline-block">
        {title}
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <div className="text-[11.5px] text-ink-faint">{label}</div>
      <div className="font-display tabular mt-1 text-[32px] leading-none text-ink">
        {value}
        <span className="ml-1 text-[13px] text-ink-muted">{hint}</span>
      </div>
    </div>
  );
}

function formatVotes(entries: { votes: number }[]): string {
  const total = entries.reduce((s, e) => s + e.votes, 0);
  if (total >= 10_000_000) return `${(total / 10_000_000).toFixed(1)} 千万`;
  if (total >= 10_000) return `${(total / 10_000).toFixed(0)} 万`;
  return String(total);
}

function percentile(entries: { rank: number }[], rank?: number): string {
  if (!rank) return "—";
  return `${Math.round((1 - rank / entries.length) * 100)}%`;
}

function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

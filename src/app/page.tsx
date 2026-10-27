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
  estimateRequestCost,
} from "@/lib/data";

const SECTIONS = [
  { id: "overview", label: "总览" },
  { id: "intelligence", label: "能力评分" },
  { id: "capability", label: "能力指数" },
  { id: "boards", label: "分维度榜单" },
  { id: "openness", label: "开放程度" },
  { id: "comparisons", label: "能力对比" },
  { id: "token-use", label: "Token 用量" },
  { id: "cost", label: "成本" },
  { id: "context", label: "上下文窗口" },
  { id: "value", label: "性价比" },
  { id: "size", label: "模型规模" },
  { id: "table", label: "完整榜单" },
];

const OPEN_COLOR = "#16a34a";
const CLOSED_COLOR = "#4f7cf7";

export default function Home() {
  const overall = dataset.boards.overall.entries;
  const models = getAllModels();
  const priced = overall.filter((e) => e.promptPrice != null && e.promptPrice > 0);

  const top3 = overall.slice(0, 3);
  const openTop = overall.find((e) => e.openWeights);
  const cheapest = priced.length
    ? priced.reduce((a, b) => (a.promptPrice! <= b.promptPrice! ? a : b))
    : null;
  const maxCtx = [...overall].sort(
    (a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0),
  )[0];

  const colorOf = (open: boolean) => (open ? OPEN_COLOR : CLOSED_COLOR);

  const intelBars = overall.slice(0, 40).map((e) => ({
    label: e.name,
    value: e.elo,
    color: colorOf(e.openWeights),
  }));
  const openBars = overall.filter((e) => e.openWeights).slice(0, 24).map((e) => ({
    label: e.name,
    value: e.elo,
    color: OPEN_COLOR,
  }));
  const closedBars = overall.filter((e) => !e.openWeights).slice(0, 24).map((e) => ({
    label: e.name,
    value: e.elo,
    color: CLOSED_COLOR,
  }));

  const costScatter = priced.slice(0, 180).map((e) => ({
    name: e.name,
    x: e.promptPrice as number,
    y: e.elo,
    highlight: e.openWeights,
  }));

  const reqCostBars = overall
    .filter((e) => e.promptPrice != null && e.completionPrice != null)
    .map((e) => ({
      label: e.name,
      value: Number((estimateRequestCost(e)! * 1000).toFixed(3)),
      color: colorOf(e.openWeights),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 28);

  const outputPriceBars = [...priced]
    .sort((a, b) => a.completionPrice! - b.completionPrice!)
    .slice(0, 28)
    .map((e) => ({
      label: e.name,
      value: e.completionPrice as number,
      color: "#ea580c",
    }));

  const inputPriceBars = [...priced]
    .sort((a, b) => a.promptPrice! - b.promptPrice!)
    .slice(0, 28)
    .map((e) => ({
      label: e.name,
      value: e.promptPrice as number,
      color: "#0891b2",
    }));

  const cacheBars = overall
    .filter((e) => e.cacheReadPrice != null)
    .sort((a, b) => (a.cacheReadPrice as number) - (b.cacheReadPrice as number))
    .slice(0, 24)
    .map((e) => ({
      label: e.name,
      value: e.cacheReadPrice as number,
      color: "#7c3aed",
    }));

  const ctxBars = [...overall]
    .filter((e) => e.contextLength != null)
    .sort((a, b) => (b.contextLength as number) - (a.contextLength as number))
    .slice(0, 30)
    .map((e) => ({
      label: e.name,
      value: Math.round((e.contextLength as number) / 1000),
      color: "#0891b2",
    }));

  const ragBars = ctxBars.slice(0, 20);

  const outputLenBars = [...overall]
    .filter((e) => e.maxOutput != null)
    .sort((a, b) => (b.maxOutput as number) - (a.maxOutput as number))
    .slice(0, 28)
    .map((e) => ({
      label: e.name,
      value: Math.round((e.maxOutput as number) / 1000),
      color: "#0d9488",
    }));

  const paramBars = models
    .filter((m) => m.parameters != null)
    .sort((a, b) => (b.parameters as number) - (a.parameters as number))
    .slice(0, 28)
    .map((m) => ({
      label: m.name,
      value: Number(((m.parameters as number) / 1e9).toFixed(1)),
      color: OPEN_COLOR,
    }));

  const paramScatter = models
    .filter((m) => m.parameters != null)
    .map((m) => ({
      name: m.name,
      x: (m.parameters as number) / 1e9,
      y: m.elo,
      highlight: true,
    }));

  const valueTop = models
    .map((m) => {
      const price = blendedPrice(m);
      if (price == null || price <= 0) return null;
      const ability = Math.max(m.elo - 1000, 1);
      return { name: m.name, costPerPoint: price / ability };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.costPerPoint - b.costPerPoint)
    .slice(0, 24);

  const opennessBars = models
    .filter((m) => m.openWeights)
    .map((m) => {
      let score = 40;
      if (m.parameters != null) score += 30;
      const lic = (m.license ?? "").toLowerCase();
      if (lic.includes("apache") || lic.includes("mit")) score += 30;
      else if (lic.includes("llama") || lic.includes("gemma")) score += 15;
      else if (!lic.includes("proprietary")) score += 10;
      return { label: m.name, value: Math.min(score, 100), color: OPEN_COLOR };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 28);

  return (
    <>
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
                  ，其后为 <strong className="font-medium text-ink">{top3[1]?.name}</strong> 与{" "}
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
                  超过综合榜 {percentile(overall, openTop?.rank)} 的模型。
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
                  <strong className="font-medium text-ink">{maxCtx?.name ?? "—"}</strong> 支持{" "}
                  {formatContext(maxCtx?.contextLength ?? null)} tokens，
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

      <section className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="能力评分" subtitle="LMArena 盲测 Elo 分数 · 越高越好">
            <BarChart data={intelBars.slice(0, 6)} height={300} maxBars={6} />
          </ChartCard>
          <ChartCard title="输出价格" subtitle="每百万输出 token 的美元价格 · 越低越好">
            <BarChart data={outputPriceBars.slice(0, 6)} height={300} maxBars={6} format="price" />
          </ChartCard>
          <ChartCard title="上下文窗口" subtitle="最大输入输出总长度 · 越大越好">
            <BarChart data={ctxBars.slice(0, 6)} height={300} maxBars={6} valueSuffix="K" />
          </ChartCard>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1400px] gap-8 px-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <SectionNav sections={SECTIONS} />
        </aside>

        <div className="min-w-0 flex-1 space-y-10 pb-8">
          <Section id="overview" title="总览">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="收录模型" value={String(dataset.meta.modelCount)} hint="个" />
              <StatTile label="覆盖厂商" value={String(dataset.meta.vendorCount)} hint="家" />
              <StatTile label="榜单维度" value={String(boardKeys.length)} hint="个" />
              <StatTile label="有价格数据" value={String(priced.length)} hint="个" />
            </div>
          </Section>

          <Section id="intelligence" title="能力评分">
            <div className="space-y-4">
              <ChartCard
                title="综合能力排名"
                subtitle="LMArena 综合榜 Elo 评分。绿色为开放权重模型，蓝色为闭源模型。"
                note="票数低于 1000 的模型置信区间较宽，名次可能波动。"
              >
                <BarChart data={intelBars} height={420} maxBars={40} />
              </ChartCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="开放权重模型排名" subtitle="仅含开放权重（开源）模型">
                  <BarChart data={openBars} height={380} maxBars={24} />
                </ChartCard>
                <ChartCard title="闭源模型排名" subtitle="仅含闭源 / 专有许可模型">
                  <BarChart data={closedBars} height={380} maxBars={24} />
                </ChartCard>
              </div>
            </div>
          </Section>

          <Section id="capability" title="能力指数">
            <div className="grid gap-4 sm:grid-cols-2">
              {boardKeys
                .filter((k) => k !== "overall")
                .map((k) => {
                  const b = dataset.boards[k];
                  const bars = b.entries.slice(0, 10).map((e) => ({
                    label: e.name,
                    value: e.elo,
                    color: colorOf(e.openWeights),
                  }));
                  return (
                    <ChartCard
                      key={k}
                      title={`${b.label}指数`}
                      subtitle={`${b.entries.length} 个模型参评 · LMArena ${b.label}分类`}
                    >
                      <BarChart data={bars} height={340} maxBars={10} />
                    </ChartCard>
                  );
                })}
            </div>
          </Section>

          <Section id="boards" title="分维度榜单">
            <div className="grid gap-4 sm:grid-cols-2">
              {boardKeys.map((k) => {
                const b = dataset.boards[k];
                return (
                  <ChartCard
                    key={k}
                    title={`${b.label}榜 TOP5`}
                    subtitle={`${b.entries.length} 个模型参评`}
                  >
                    <ol className="space-y-2">
                      {b.entries.slice(0, 5).map((e) => (
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
          </Section>

          <Section id="openness" title="开放程度">
            <ChartCard
              title="开放权重模型开放度评分"
              subtitle="综合「是否公开权重、是否公开参数量、许可证是否允许商用」三项给出的 0-100 分估算，并非官方评分。"
              note="许可判定：Apache/MIT 记满分，Llama/Gemma 等社区许可记部分分，其他开放许可记基础分。"
            >
              <BarChart data={opennessBars} height={400} maxBars={28} />
            </ChartCard>
          </Section>

          <Section id="comparisons" title="能力对比">
            <div className="space-y-4">
              <ChartCard
                title="能力 vs 输入价格"
                subtitle="横轴为每百万输入 token 的美元价格（对数刻度），纵轴为综合 Elo。左上角代表「高能力、低价格」。"
                note={`仅展示 ${priced.length} 个能匹配到价格的模型，其余因命名差异未收录。`}
              >
                <ScatterChart
                  data={costScatter}
                  xLabel="输入价格（美元 / 百万 token）"
                  yLabel="综合 Elo"
                  logX
                  format="price"
                />
              </ChartCard>

              <ChartCard
                title="能力 vs 参数量"
                subtitle="横轴为模型参数规模（十亿），纵轴为综合 Elo。含参数量数据的开放权重模型。"
                note={`共 ${paramScatter.length} 个模型有参数量数据，来自 HuggingFace 的 safetensors 元数据。`}
              >
                <ScatterChart
                  data={paramScatter}
                  xLabel="参数量（十亿）"
                  yLabel="综合 Elo"
                  logX
                  format="number"
                />
              </ChartCard>
            </div>
          </Section>

          <Section id="token-use" title="Token 用量">
            <ChartCard
              title="最大输出 Token 数"
              subtitle="单次回复允许的最大 token 数（千）。输出上限越高，越能生成长文档与长代码。"
            >
              <BarChart data={outputLenBars} height={400} maxBars={28} valueSuffix="K" />
            </ChartCard>
          </Section>

          <Section id="cost" title="成本">
            <div className="space-y-4">
              <ChartCard
                title="每次请求成本估算"
                subtitle="按输入 1000 token + 输出 500 token 估算的单次调用成本（单位：千分之一美元）。"
                note="实际成本取决于真实用量与缓存命中率，此处仅为可比口径的粗估。"
              >
                <BarChart data={reqCostBars} height={400} maxBars={28} format="milli" />
              </ChartCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="输入价格" subtitle="每百万输入 token 价格，由低到高">
                  <BarChart data={inputPriceBars} height={380} maxBars={28} format="price" />
                </ChartCard>
                <ChartCard title="输出价格" subtitle="每百万输出 token 价格，由低到高">
                  <BarChart data={outputPriceBars} height={380} maxBars={28} format="price" />
                </ChartCard>
              </div>

              <ChartCard
                title="缓存命中价格"
                subtitle="缓存读取价格，通常为常规输入价格的 10%~25%。适合有大量重复上下文的场景。"
              >
                {cacheBars.length > 0 ? (
                  <BarChart data={cacheBars} height={360} maxBars={24} format="price" />
                ) : (
                  <p className="py-10 text-center text-[12.5px] text-ink-faint">
                    暂无模型提供缓存价格数据
                  </p>
                )}
              </ChartCard>
            </div>
          </Section>

          <Section id="context" title="上下文窗口">
            <div className="space-y-4">
              <ChartCard
                title="最大上下文长度"
                subtitle="单次请求可容纳的最大 token 数（千）。上下文越大，越能处理长文档与大型代码库。"
              >
                <BarChart data={ctxBars} height={400} maxBars={30} valueSuffix="K" />
              </ChartCard>
              <ChartCard
                title="适合 RAG 的上下文长度"
                subtitle="检索增强生成场景下，上下文窗口越大能塞入越多检索片段。此处展示窗口最大的 20 个模型。"
              >
                <BarChart data={ragBars} height={380} maxBars={20} valueSuffix="K" />
              </ChartCard>
            </div>
          </Section>

          <Section id="value" title="性价比">
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
          </Section>

          <Section id="size" title="模型规模（仅开放权重）">
            <div className="space-y-4">
              <ChartCard
                title="参数量对比"
                subtitle="模型总参数量（十亿）。参数量越大通常能力越强，但推理成本与延迟也越高。"
                note={`仅 ${paramBars.length} 个开放权重模型能取到参数量，数据来自 HuggingFace safetensors 元数据。`}
              >
                {paramBars.length > 0 ? (
                  <BarChart data={paramBars} height={400} maxBars={28} valueSuffix="B" />
                ) : (
                  <p className="py-10 text-center text-[12.5px] text-ink-faint">暂无数据</p>
                )}
              </ChartCard>

              <ChartCard
                title="参数量与能力分布"
                subtitle="横轴为参数量（十亿，对数刻度），纵轴为综合 Elo。用于观察「小模型能否达到大模型的能力」。"
              >
                <ScatterChart
                  data={paramScatter}
                  xLabel="参数量（十亿）"
                  yLabel="综合 Elo"
                  logX
                  format="number"
                />
              </ChartCard>
            </div>
          </Section>

          <Section id="table" title="完整榜单">
            <ModelTable entries={overall} />
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-display mb-4 text-[30px] leading-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

function SummaryCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="inline-block rounded-full bg-mist px-2.5 py-1 text-[11.5px] text-ink-soft">
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

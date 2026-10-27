import LeaderboardShell from "@/components/LeaderboardShell";
import {
  boardKeys,
  dataset,
  formatDate,
} from "@/lib/data";

export default function Home() {
  const stats = computeStats();
  const boards = boardKeys.map((key) => dataset.boards[key]);

  return (
    <div className="mx-auto max-w-7xl px-5">
      <section className="border-b border-ink-800 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-ink-100">
              全球大模型能力排名
            </h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-400">
              汇总 {dataset.meta.modelCount} 个模型、{dataset.meta.vendorCount} 家厂商的人类盲测对战结果，
              按综合、中文、编程等 {boardKeys.length} 个维度独立排名。数据更新于{" "}
              <span className="text-ink-200">{formatDate(dataset.meta.leaderboardDate)}</span>。
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <Stat label="收录模型" value={String(dataset.meta.modelCount)} />
            <Stat label="覆盖厂商" value={String(dataset.meta.vendorCount)} />
            <Stat label="投票总数" value={stats.totalVotes} />
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.highlights.map((h) => (
            <Highlight key={h.label} label={h.label} primary={h.primary} detail={h.detail} />
          ))}
        </div>
      </section>

      <section className="py-8">
        <LeaderboardShell boards={boards} defaultKey="overall" />
      </section>
    </div>
  );
}

function computeStats() {
  const entries = dataset.boards.overall.entries;
  const top = entries[0];
  const openTop = entries.find((e) => e.openWeights);
  const priced = entries.filter((e) => e.promptPrice != null && e.promptPrice > 0);
  const cheapest = priced.length
    ? priced.reduce((a, b) => (a.promptPrice! <= b.promptPrice! ? a : b))
    : null;
  const maxCtx = [...entries].sort(
    (a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0),
  )[0];

  const totalVotesRaw = entries.reduce((s, e) => s + e.votes, 0);

  return {
    totalVotes: formatVotes(totalVotesRaw),
    highlights: [
      {
        label: "综合榜首",
        primary: top?.name ?? "—",
        detail: top ? `Elo ${top.elo.toFixed(0)} · ${top.vendorLabel}` : "",
      },
      {
        label: "开源第一",
        primary: openTop?.name ?? "—",
        detail: openTop ? `Elo ${openTop.elo.toFixed(0)} · ${openTop.vendorLabel}` : "—",
      },
      {
        label: "最低价",
        primary: cheapest?.name ?? "—",
        detail: cheapest ? `$${cheapest.promptPrice} / 百万 token` : "暂无价格数据",
      },
      {
        label: "最大上下文",
        primary: maxCtx?.name ?? "—",
        detail: maxCtx?.contextLength
          ? `${(maxCtx.contextLength / 1_000_000).toFixed(1)}M tokens`
          : "—",
      },
    ],
  };
}

function formatVotes(total: number): string {
  if (total >= 10_000_000) return `${(total / 10_000_000).toFixed(1)} 千万`;
  if (total >= 10_000) return `${(total / 10_000).toFixed(0)} 万`;
  return String(total);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tabular text-[20px] font-semibold text-ink-100">{value}</div>
      <div className="text-[11.5px] text-ink-500">{label}</div>
    </div>
  );
}

function Highlight({
  label,
  primary,
  detail,
}: {
  label: string;
  primary: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
      <div className="text-[11.5px] text-ink-500">{label}</div>
      <div className="mt-1.5 truncate text-[14px] font-medium text-ink-100" title={primary}>
        {primary}
      </div>
      <div className="mt-0.5 truncate text-[11.5px] text-ink-400 tabular">{detail}</div>
    </div>
  );
}

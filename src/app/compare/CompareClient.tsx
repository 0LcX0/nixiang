"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  blendedPrice,
  formatContext,
  formatNumber,
  formatPrice,
  type ModelSummary,
} from "@/lib/data";

interface Props {
  models: ModelSummary[];
  ranksByName: Record<string, { key: string; label: string; rank: number; total: number }[]>;
  boardLabels: { key: string; label: string }[];
}

export default function CompareClient({ models, ranksByName, boardLabels }: Props) {
  const sorted = useMemo(() => [...models].sort((a, b) => b.elo - a.elo), [models]);
  const [selected, setSelected] = useState<string[]>(sorted.slice(0, 2).map((m) => m.slug));
  const [query, setQuery] = useState("");

  const chosen = selected
    .map((slug) => sorted.find((m) => m.slug === slug))
    .filter((m): m is ModelSummary => Boolean(m));

  const filtered = query.trim()
    ? sorted.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) || m.vendorLabel.includes(query),
      )
    : sorted;

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return prev;
      return [...prev, slug];
    });
  }

  const metrics: { label: string; render: (m: ModelSummary) => string }[] = [
    { label: "综合 Elo", render: (m) => m.elo.toFixed(0) },
    { label: "投票数", render: (m) => formatNumber(m.votes) },
    { label: "输入价格 /M", render: (m) => formatPrice(m.promptPrice) },
    { label: "输出价格 /M", render: (m) => formatPrice(m.completionPrice) },
    { label: "综合价格 /M", render: (m) => formatPrice(blendedPrice(m)) },
    { label: "上下文窗口", render: (m) => formatContext(m.contextLength) },
    { label: "权重", render: (m) => (m.openWeights ? "开放权重" : "闭源") },
    {
      label: "推理模型",
      render: (m) => (m.reasoning ? "是" : m.reasoning === false ? "否" : "—"),
    },
  ];

  return (
    <div>
      <div className="rounded-lg border border-line bg-paper">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="text-[12.5px] text-ink-soft">选择模型（最多 4 个）</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索…"
            className="ml-auto w-44 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink placeholder:text-ink-faint outline-none focus:border-line-strong"
          />
        </div>

        <div className="grid max-h-80 grid-cols-2 gap-0.5 overflow-y-auto p-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.slice(0, 200).map((m) => {
            const on = selected.includes(m.slug);
            return (
              <button
                key={m.slug}
                onClick={() => toggle(m.slug)}
                disabled={!on && selected.length >= 4}
                className={`truncate rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                  on
                    ? "bg-brand-soft text-brand"
                    : "text-ink-soft hover:bg-mist disabled:opacity-40"
                }`}
                title={m.name}
              >
                {on && <span className="mr-1">✓</span>}
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-ink-faint">请至少选择一个模型</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-mist">
                <th className="w-40 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  指标
                </th>
                {chosen.map((m) => (
                  <th key={m.slug} className="px-4 py-3 text-left font-medium">
                    <Link href={`/models/${m.slug}`} className="text-[13px] text-ink hover:text-brand">
                      {m.name}
                    </Link>
                    <div className="mt-0.5 text-[11px] font-normal text-ink-muted">
                      {m.vendorLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink-muted">{row.label}</td>
                  {chosen.map((m) => (
                    <td key={m.slug} className="px-4 py-2.5 tabular text-ink">
                      {row.render(m)}
                    </td>
                  ))}
                </tr>
              ))}
              {boardLabels.map((b) => (
                <tr key={b.key} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink-muted">{b.label}榜排名</td>
                  {chosen.map((m) => {
                    const r = ranksByName[m.name]?.find((x) => x.key === b.key);
                    return (
                      <td key={m.slug} className="px-4 py-2.5 tabular text-ink">
                        {r ? `#${r.rank}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-ink-faint">
        综合价格按输入 25%、输出 75% 加权计算。
      </p>
    </div>
  );
}

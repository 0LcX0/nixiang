"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatContext,
  formatNumber,
  formatPrice,
  type BoardEntry,
} from "@/lib/data";

type Filter = "all" | "open" | "proprietary" | "reasoning";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "open", label: "开放权重" },
  { id: "proprietary", label: "闭源" },
  { id: "reasoning", label: "推理模型" },
];

export default function ModelTable({ entries }: { entries: BoardEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "elo" | "price" | "context">("rank");

  const rows = useMemo(() => {
    let list = entries;
    if (filter === "open") list = list.filter((e) => e.openWeights);
    else if (filter === "proprietary") list = list.filter((e) => !e.openWeights);
    else if (filter === "reasoning") list = list.filter((e) => e.reasoning === true);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.vendorLabel.toLowerCase().includes(q) ||
          e.vendor.toLowerCase().includes(q),
      );
    }

    if (sortBy === "elo") list = [...list].sort((a, b) => b.elo - a.elo);
    else if (sortBy === "price")
      list = [...list].sort((a, b) => {
        if (a.promptPrice == null) return 1;
        if (b.promptPrice == null) return -1;
        return a.promptPrice - b.promptPrice;
      });
    else if (sortBy === "context")
      list = [...list].sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0));

    return list;
  }, [entries, filter, query, sortBy]);

  const maxElo = entries.length ? Math.max(...entries.map((e) => e.elo)) : 1;
  const minElo = entries.length ? Math.min(...entries.map((e) => e.elo)) : 0;

  return (
    <div className="rounded-lg border border-line bg-paper">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex rounded-md border border-line p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded px-2.5 py-1 text-[12px] transition-colors ${
                filter === f.id ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索模型或厂商…"
          className="w-48 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink placeholder:text-ink-faint outline-none focus:border-line-strong"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-soft outline-none focus:border-line-strong"
        >
          <option value="rank">按排名</option>
          <option value="elo">按评分</option>
          <option value="price">按价格</option>
          <option value="context">按上下文</option>
        </select>

        <span className="ml-auto tabular text-[11.5px] text-ink-faint">
          {rows.length} / {entries.length} 个模型
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="w-14 px-3 py-2.5 text-right font-medium">排名</th>
              <th className="px-3 py-2.5 text-left font-medium">模型</th>
              <th className="px-3 py-2.5 text-left font-medium">厂商</th>
              <th className="w-36 px-3 py-2.5 text-left font-medium">评分</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">票数</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">上下文</th>
              <th className="w-24 px-3 py-2.5 text-right font-medium">输入价格</th>
              <th className="w-16 px-3 py-2.5 text-center font-medium">权重</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const pct = maxElo === minElo ? 100 : ((e.elo - minElo) / (maxElo - minElo)) * 100;
              return (
                <tr key={`${e.name}-${i}`} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-3 py-2 text-right tabular text-ink-muted">{e.rank}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/models/${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      className="text-ink hover:text-brand"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{e.vendorLabel}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-right tabular">{e.elo.toFixed(0)}</span>
                      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-mist-deep">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-brand"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular text-ink-muted">{formatNumber(e.votes)}</td>
                  <td className="px-3 py-2 text-right tabular text-ink-muted">
                    {formatContext(e.contextLength)}
                  </td>
                  <td className="px-3 py-2 text-right tabular text-ink-soft">
                    {formatPrice(e.promptPrice)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10.5px] ${
                        e.openWeights
                          ? "bg-green-50 text-green-700"
                          : "bg-mist text-ink-muted"
                      }`}
                    >
                      {e.openWeights ? "开源" : "闭源"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-ink-faint">
                  没有符合条件的模型
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

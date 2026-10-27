"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BoardEntry } from "@/lib/data";
import { formatContext, formatNumber, formatPrice } from "@/lib/data";

type Filter = "all" | "open" | "proprietary" | "reasoning";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "open", label: "开放权重" },
  { id: "proprietary", label: "闭源" },
  { id: "reasoning", label: "推理模型" },
];

interface Props {
  entries: BoardEntry[];
}

export default function Leaderboard({ entries }: Props) {
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
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-ink-800 bg-ink-900 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
                filter === f.id
                  ? "bg-ink-700 text-ink-100"
                  : "text-ink-400 hover:text-ink-200"
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
          className="w-52 rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-[12.5px] text-ink-100 placeholder:text-ink-500 outline-none focus:border-accent-600"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-[12.5px] text-ink-200 outline-none focus:border-accent-600"
        >
          <option value="rank">按排名</option>
          <option value="elo">按评分</option>
          <option value="price">按价格（低→高）</option>
          <option value="context">按上下文（大→小）</option>
        </select>

        <span className="ml-auto text-[12px] text-ink-500 tabular">
          {rows.length} / {entries.length} 个模型
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900 text-[11.5px] uppercase tracking-wide text-ink-500">
                <th className="w-14 px-3 py-2.5 text-right font-medium">排名</th>
                <th className="px-3 py-2.5 text-left font-medium">模型</th>
                <th className="px-3 py-2.5 text-left font-medium">厂商</th>
                <th className="w-40 px-3 py-2.5 text-left font-medium">评分</th>
                <th className="w-20 px-3 py-2.5 text-right font-medium">票数</th>
                <th className="w-24 px-3 py-2.5 text-right font-medium">上下文</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">输入价格</th>
                <th className="w-20 px-3 py-2.5 text-center font-medium">类型</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const pct =
                  maxElo === minElo ? 100 : ((e.elo - minElo) / (maxElo - minElo)) * 100;
                return (
                  <tr
                    key={`${e.name}-${i}`}
                    className="border-b border-ink-850 last:border-0 hover:bg-ink-900/70"
                  >
                    <td className="px-3 py-2.5 text-right tabular text-ink-400">
                      {e.rank <= 3 ? (
                        <span
                          className={
                            e.rank === 1
                              ? "font-semibold text-gold-400"
                              : "font-semibold text-ink-200"
                          }
                        >
                          {e.rank}
                        </span>
                      ) : (
                        e.rank
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/models/${encodeURIComponent(
                          e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                        )}`}
                        className="font-medium text-ink-100 hover:text-accent-400"
                      >
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink-400">{e.vendorLabel}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-11 shrink-0 text-right tabular font-medium">
                          {e.elo.toFixed(0)}
                        </span>
                        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-accent-500"
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-400">
                      {formatNumber(e.votes)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-400">
                      {formatContext(e.contextLength)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-ink-300">
                      {formatPrice(e.promptPrice)}
                      {e.promptPrice != null && (
                        <span className="text-ink-600"> /M</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {e.openWeights ? (
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
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-ink-500">
                    没有符合条件的模型
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-600">
        评分为 LMArena 盲测对战的 Elo 分数，数值越高代表人类投票偏好越强。票数低于
        1000 的模型置信区间较大，排名波动可能明显。价格为 OpenRouter 上的输入价格
        （每百万 token），未收录的模型显示「—」。
      </p>
    </div>
  );
}

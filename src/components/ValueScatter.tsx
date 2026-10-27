"use client";

import { useMemo, useState } from "react";
import { formatPrice, type BoardEntry } from "@/lib/data";

interface Props {
  entries: BoardEntry[];
}

/**
 * 能力-价格散点图。用 SVG 手绘，避免为一张图引入图表库。
 * 横轴为输入价格（对数刻度），纵轴为 Elo。
 */
export default function ValueScatter({ entries }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(
    () =>
      entries
        .filter((e) => e.promptPrice != null && e.promptPrice > 0)
        .map((e) => ({ ...e, price: e.promptPrice as number }))
        .sort((a, b) => a.price - b.price),
    [entries],
  );

  if (points.length < 4) return null;

  const W = 760;
  const H = 320;
  const PAD = { l: 52, r: 22, t: 18, b: 40 };

  const prices = points.map((p) => p.price);
  const elos = points.map((p) => p.elo);
  const minLog = Math.log10(Math.min(...prices));
  const maxLog = Math.log10(Math.max(...prices));
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);

  // 坐标保留两位小数：服务端与客户端的浮点运算末位可能不同，
  // 直接输出完整精度会导致 hydration 属性不一致
  const round = (n: number) => Math.round(n * 100) / 100;
  const x = (price: number) =>
    round(
      PAD.l +
        ((Math.log10(price) - minLog) / Math.max(maxLog - minLog, 0.001)) *
          (W - PAD.l - PAD.r),
    );
  const y = (elo: number) =>
    round(
      H - PAD.b - ((elo - minElo) / Math.max(maxElo - minElo, 1)) * (H - PAD.t - PAD.b),
    );

  // 性价比前沿：在每个价格区间内保留分数最高的点，连成一条参考线
  const frontier: typeof points = [];
  for (const p of points) {
    const last = frontier[frontier.length - 1];
    if (!last || p.elo > last.elo) frontier.push(p);
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const log = minLog + (maxLog - minLog) * t;
    return {
      pos: Math.round((PAD.l + t * (W - PAD.l - PAD.r)) * 100) / 100,
      label: formatPrice(10 ** log),
    };
  });

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-ink-200">能力与价格分布</h3>
        <span className="text-[11px] text-ink-500">横轴对数刻度 · 悬停查看模型</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Elo 与价格散点图">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = H - PAD.b - t * (H - PAD.t - PAD.b);
          const val = minElo + (maxElo - minElo) * t;
          return (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={yy}
                y2={yy}
                stroke="#22262f"
                strokeWidth="1"
              />
              <text x={PAD.l - 8} y={yy + 3.5} textAnchor="end" fontSize="10" fill="#6b7385">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {ticks.map((t, i) => (
          <text
            key={`tick-${i}`}
            x={t.pos}
            y={H - PAD.b + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7385"
          >
            {t.label}
          </text>
        ))}

        <polyline
          points={frontier.map((p) => `${x(p.price)},${y(p.elo)}`).join(" ")}
          fill="none"
          stroke="#3fb8a4"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />

        {points.map((p, i) => (
          <g key={`${p.name}-${i}`}>
            <circle
              cx={x(p.price)}
              cy={y(p.elo)}
              r={3}
              fill={p.openWeights ? "#3fb8a4" : "#4f8cff"}
              opacity={0.85}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
            {hover === i && (
              <text
                x={x(p.price)}
                y={y(p.elo) - 10}
                textAnchor="middle"
                fontSize="10.5"
                fill="#e6e9ef"
              >
                {p.name}
              </text>
            )}
          </g>
        ))}

        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#4a5162">
          输入价格（美元 / 百万 token）
        </text>
      </svg>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-teal-400" /> 开放权重
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent-500" /> 闭源
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-4 border-t border-dashed border-teal-400" /> 性价比前沿
        </span>
        <span className="ml-auto tabular">{points.length} 个模型有价格</span>
      </div>
    </div>
  );
}

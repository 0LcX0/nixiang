"use client";

import { useState } from "react";

export interface BarDatum {
  label: string;
  sublabel?: string;
  value: number;
  color?: string;
  highlight?: boolean;
}

interface Props {
  data: BarDatum[];
  height?: number;
  valueSuffix?: string;
  maxBars?: number;
  /** 数值格式：数字 / 美元 / 千 */
  format?: "number" | "price" | "compact";
}

/**
 * 竖向柱状图。x 轴标签斜排，柱顶标数值，风格对齐专业数据站。
 * 纯 SVG 实现，不引入图表库。
 */
export default function BarChart({
  data,
  height = 320,
  valueSuffix = "",
  maxBars = 34,
  format = "number",
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const items = data.slice(0, maxBars);
  if (items.length === 0) return null;

  const W = 1000;
  // compact 模式（卡片内少量柱子）：始终缩进容器，不滚动
  const compact = items.length <= 8;
  const minSlot = compact ? 0 : 46;
  const fittedW = compact ? W : Math.max(W, items.length * minSlot + 16);
  const PAD = { l: 8, r: 8, t: 34, b: compact ? 84 : 104 };
  const plotH = height - PAD.t - PAD.b;
  const max = Math.max(...items.map((d) => d.value)) || 1;
  const min = Math.min(...items.map((d) => d.value), 0);
  const span = max - min || 1;

  const slot = (fittedW - PAD.l - PAD.r) / items.length;
  const barW = Math.min(slot * (compact ? 0.42 : 0.66), compact ? 60 : 34);
  const dense = items.length > 16;
  const valueFont = compact ? 13 : dense ? 10 : 11;
  const labelFont = compact ? 13 : dense ? 10 : 10.5;

  const y = (v: number) => PAD.t + plotH - ((v - min) / span) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    yy: PAD.t + plotH * t,
    val: max - span * t,
  }));

  const fmt =
    format === "price"
      ? (v: number) => (v < 0.01 ? `$${v.toFixed(4)}` : v < 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`)
      : format === "compact"
        ? (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))
        : (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  return (
    <div className="relative">
      <div className={compact ? "" : "overflow-x-auto"}>
      <svg
        viewBox={`0 0 ${fittedW} ${height}`}
        width={compact ? undefined : fittedW}
        height={compact ? undefined : height}
        className={compact ? "w-full" : undefined}
        style={compact ? undefined : { minWidth: fittedW }}
        role="img"
      >
        {gridLines.map((g, i) => (
          <line
            key={i}
            x1={PAD.l}
            x2={fittedW - PAD.r}
            y1={Math.round(g.yy * 100) / 100}
            y2={Math.round(g.yy * 100) / 100}
            stroke="#eceef1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {items.map((d, i) => {
          const cx = PAD.l + slot * (i + 0.5);
          const top = y(d.value);
          const h = Math.max(PAD.t + plotH - top, 1);
          const color = d.color ?? (d.highlight ? "#6d28d9" : "#4f7cf7");
          return (
            <g
              key={`${d.label}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={Math.round((cx - barW / 2) * 100) / 100}
                y={Math.round(top * 100) / 100}
                width={Math.round(barW * 100) / 100}
                height={Math.round(h * 100) / 100}
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.45}
                rx="2"
              />
              <text
                x={cx}
                y={Math.round(top - 7)}
                textAnchor="middle"
                fontSize={valueFont}
                fill={hover === i ? "#0a0a0a" : "#3d3d3d"}
                fontWeight="500"
              >
                {fmt(d.value)}
                {valueSuffix}
              </text>
              <text
                x={cx}
                y={height - PAD.b + 12}
                textAnchor="end"
                fontSize={labelFont}
                fill={hover === i ? "#0a0a0a" : "#6b6b6b"}
                transform={`rotate(-50 ${cx} ${height - PAD.b + 12})`}
              >
                {d.label.length > 20 ? `${d.label.slice(0, 19)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}

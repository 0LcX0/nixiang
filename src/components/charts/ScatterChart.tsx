"use client";

import { useState } from "react";

export interface ScatterDatum {
  name: string;
  x: number;
  y: number;
  highlight?: boolean;
  vendor?: string;
}

interface Props {
  data: ScatterDatum[];
  height?: number;
  xLabel: string;
  yLabel: string;
  logX?: boolean;
  /** 数值格式，避免从服务端组件传函数 */
  format?: "number" | "price";
}

/** 散点图，支持对数横轴，用于「能力 vs 价格」这类对比。 */
export default function ScatterChart({
  data,
  height = 360,
  xLabel,
  yLabel,
  logX = false,
  format = "number",
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 1000;
  const PAD = { l: 62, r: 24, t: 20, b: 52 };

  const tx = (v: number) => (logX ? Math.log10(Math.max(v, 1e-6)) : v);
  const xs = data.map((d) => tx(d.x));
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const round = (n: number) => Math.round(n * 100) / 100;
  const px = (v: number) =>
    round(PAD.l + ((tx(v) - minX) / spanX) * (W - PAD.l - PAD.r));
  const py = (v: number) =>
    round(height - PAD.b - ((v - minY) / spanY) * (height - PAD.t - PAD.b));

  const fx =
    format === "price"
      ? (v: number) => (v < 1 ? `${v.toFixed(2)}` : `${v.toFixed(0)}`)
      : (v: number) => v.toFixed(2);
  const fy = (v: number) => v.toFixed(0);

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const raw = minX + spanX * t;
    const val = logX ? 10 ** raw : raw;
    return { pos: round(PAD.l + t * (W - PAD.l - PAD.r)), label: fx(val) };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${height}`} width={W} height={height} style={{ minWidth: W }} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = round(height - PAD.b - t * (height - PAD.t - PAD.b));
          return (
            <g key={`gy-${t}`}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={yy}
                y2={yy}
                stroke="#eceef1"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={PAD.l - 8} y={yy + 3.5} textAnchor="end" fontSize="10" fill="#9a9a9a">
                {fy(minY + spanY * t)}
              </text>
            </g>
          );
        })}

        {xTicks.map((t, i) => (
          <text key={`gx-${i}`} x={t.pos} y={height - PAD.b + 16} textAnchor="middle" fontSize="10" fill="#9a9a9a">
            {t.label}
          </text>
        ))}

        {data.map((d, i) => (
          <circle
            key={`${d.name}-${i}`}
            cx={px(d.x)}
            cy={py(d.y)}
            r={hover === i ? 6 : 3.5}
            fill={d.highlight ? "#6d28d9" : "#4f7cf7"}
            opacity={hover === null || hover === i ? 0.8 : 0.3}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          />
        ))}

        {hover !== null && (
          <text
            x={Math.min(Math.max(px(data[hover].x), PAD.l + 40), W - PAD.r - 40)}
            y={Math.max(py(data[hover].y) - 12, 14)}
            textAnchor="middle"
            fontSize="11"
            fill="#0a0a0a"
            fontWeight="500"
          >
            {data[hover].name}
          </text>
        )}

        <text x={W / 2} y={height - 6} textAnchor="middle" fontSize="10.5" fill="#6b6b6b">
          {xLabel}
        </text>
        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          fontSize="10.5"
          fill="#6b6b6b"
          transform={`rotate(-90 14 ${height / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  note?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 图表卡片：白底、细边框、圆角，标题用衬线体。 */
export default function ChartCard({ title, subtitle, note, actions, children, className = "" }: Props) {
  return (
    <div className={`rounded-lg border border-line bg-paper p-5 ${className}`}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-display text-[20px] leading-tight text-ink">{title}</h3>
        {actions}
      </div>
      {subtitle && (
        <p className="mb-4 max-w-2xl text-[12px] leading-relaxed text-ink-muted">{subtitle}</p>
      )}
      {children}
      {note && <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">{note}</p>}
    </div>
  );
}

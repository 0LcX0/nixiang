"use client";

interface Props {
  boards: { key: string; label: string; count: number }[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function BoardTabs({ boards, activeKey, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {boards.map((b) => (
        <button
          key={b.key}
          type="button"
          onClick={() => onSelect(b.key)}
          aria-pressed={b.key === activeKey}
          className={`rounded-lg border px-3.5 py-2 text-[13px] transition-colors ${
            b.key === activeKey
              ? "border-accent-600 bg-accent-500/10 text-accent-400"
              : "border-ink-800 bg-ink-900 text-ink-300 hover:border-ink-700 hover:text-ink-100"
          }`}
        >
          {b.label}
          <span className="ml-1.5 text-[11px] text-ink-500 tabular">{b.count}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Props {
  boards: { key: string; label: string; count: number }[];
}

function TabsInner({ boards }: Props) {
  const searchParams = useSearchParams();
  const activeKey = searchParams.get("board") ?? "overall";

  return (
    <div className="flex flex-wrap gap-1.5">
      {boards.map((b) => (
        <Link
          key={b.key}
          href={`/?board=${b.key}`}
          scroll={false}
          className={`rounded-lg border px-3.5 py-2 text-[13px] transition-colors ${
            b.key === activeKey
              ? "border-accent-600 bg-accent-500/10 text-accent-400"
              : "border-ink-800 bg-ink-900 text-ink-300 hover:border-ink-700 hover:text-ink-100"
          }`}
        >
          {b.label}
          <span className="ml-1.5 text-[11px] text-ink-500 tabular">{b.count}</span>
        </Link>
      ))}
    </div>
  );
}

export default function BoardTabs({ boards }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-wrap gap-1.5">
          {boards.map((b) => (
            <span
              key={b.key}
              className="rounded-lg border border-ink-800 bg-ink-900 px-3.5 py-2 text-[13px] text-ink-300"
            >
              {b.label}
              <span className="ml-1.5 text-[11px] text-ink-500 tabular">{b.count}</span>
            </span>
          ))}
        </div>
      }
    >
      <TabsInner boards={boards} />
    </Suspense>
  );
}

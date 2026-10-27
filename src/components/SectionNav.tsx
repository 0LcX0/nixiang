"use client";

import { useEffect, useState } from "react";

interface Props {
  sections: { id: string; label: string }[];
}

/** 左侧区块导航，滚动时高亮当前区块。 */
export default function SectionNav({ sections }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-24 space-y-0.5">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-[12.5px] transition-colors ${
            active === s.id
              ? "text-ink font-medium"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <span
            className={`size-2 shrink-0 rounded-sm ${
              active === s.id ? "bg-ink" : "bg-line-strong"
            }`}
          />
          {s.label}
        </a>
      ))}
    </nav>
  );
}

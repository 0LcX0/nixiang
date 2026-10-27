import Link from "next/link";

const NAV = [
  { href: "/", label: "榜单" },
  { href: "/compare", label: "对比" },
  { href: "/value", label: "性价比" },
  { href: "/methodology", label: "方法论" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded bg-ink text-[12px] font-bold text-paper">
            榜
          </span>
          <span className="font-display text-[17px] text-ink">模型榜</span>
        </Link>

        <nav className="ml-6 flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-[13.5px] text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden text-[11.5px] text-ink-faint sm:block">
          数据来自 LMArena · CC-BY-4.0
        </div>
      </div>
    </header>
  );
}

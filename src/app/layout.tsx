import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "模型榜 · 中文大模型能力排名",
    template: "%s · 模型榜",
  },
  description:
    "基于 LMArena 人类盲测数据的中文大模型排行榜，提供综合、中文、编程、创意写作等多维度排名，以及价格、上下文与性价比对比。",
  keywords: ["大模型排行榜", "AI 模型排名", "中文大模型", "LLM 榜单", "模型对比"],
};

const NAV = [
  { href: "/", label: "榜单" },
  { href: "/compare", label: "对比" },
  { href: "/value", label: "性价比" },
  { href: "/methodology", label: "方法论" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-ink-950">
        <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-5">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="grid size-7 place-items-center rounded-md bg-accent-500 text-[13px] font-bold text-white">
                榜
              </span>
              <span className="text-[15px] font-semibold tracking-tight">模型榜</span>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-[13px] text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto hidden text-[12px] text-ink-500 sm:block">
              数据来自 LMArena · CC-BY-4.0
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-ink-800">
          <div className="mx-auto max-w-7xl px-5 py-8 text-[12px] leading-relaxed text-ink-500">
            <p>
              榜单排名数据来自{" "}
              <a
                href="https://lmarena.ai"
                target="_blank"
                rel="noreferrer"
                className="text-ink-300 underline decoration-ink-600 underline-offset-2 hover:text-accent-400"
              >
                LMArena
              </a>{" "}
              （CC-BY-4.0），模型定价与规格来自{" "}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noreferrer"
                className="text-ink-300 underline decoration-ink-600 underline-offset-2 hover:text-accent-400"
              >
                OpenRouter
              </a>
              。本站独立汇总，与上述机构无隶属关系。
            </p>
            <p className="mt-2">
              排名反映人类盲测偏好，不代表任何单一场景的实际表现，请结合{" "}
              <Link
                href="/methodology"
                className="text-ink-300 underline decoration-ink-600 underline-offset-2 hover:text-accent-400"
              >
                方法论
              </Link>{" "}
              理解其局限。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

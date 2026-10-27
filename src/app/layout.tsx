import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "模型榜 · 中文大模型能力排名",
    template: "%s · 模型榜",
  },
  description:
    "基于 LMArena 人类盲测数据的中文大模型排行榜，提供综合、中文、编程、创意写作等多维度排名，以及价格、上下文与性价比对比。",
  keywords: ["大模型排行榜", "AI 模型排名", "中文大模型", "LLM 榜单", "模型对比"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="flex min-h-full flex-col bg-paper">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

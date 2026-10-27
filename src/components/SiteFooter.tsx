import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-mist">
      <div className="mx-auto max-w-[1400px] px-6 py-10 text-[12px] leading-relaxed text-ink-muted">
        <p>
          榜单排名数据来自{" "}
          <a
            href="https://lmarena.ai"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-brand"
          >
            LMArena
          </a>{" "}
          （CC-BY-4.0），模型定价与规格来自{" "}
          <a
            href="https://openrouter.ai"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-brand"
          >
            OpenRouter
          </a>
          。本站独立汇总，与上述机构无隶属关系。
        </p>
        <p className="mt-2">
          排名反映人类盲测偏好，不代表任何单一场景的实际表现，请结合{" "}
          <Link href="/methodology" className="text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-brand">
            方法论
          </Link>{" "}
          理解其局限。
        </p>
      </div>
    </footer>
  );
}

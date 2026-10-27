import Link from "next/link";
import { boardKeys, dataset, formatDate } from "@/lib/data";

export const metadata = {
  title: "方法论",
  description: "本站榜单的数据来源、排名规则、计算方式与局限说明。",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-[24px] font-semibold tracking-tight">方法论</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
        这个站点不自己跑评测，而是把公开、可验证的数据汇总成中文视角的榜单。所以每一条结论都可以追溯回原始来源。
      </p>

      <Section title="数据来源">
        <p>
          排名与 Elo 评分来自{" "}
          <a href="https://lmarena.ai" target="_blank" rel="noreferrer" className="text-brand hover:underline">
            LMArena
          </a>{" "}
          的人类盲测对战数据集（许可证 CC-BY-4.0）。用户在不知道模型身份的情况下对两个回答投票，
          系统用 Bradley-Terry 模型把胜率转换为 Elo 分数。本站在此基础上做汇总与展示。
        </p>
        <p className="mt-3">
          定价、上下文窗口与是否推理模型等信息来自{" "}
          <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-brand hover:underline">
            OpenRouter
          </a>{" "}
          的公开模型目录。价格单位统一为「每百万 token 的美元价格」，由厂商挂牌价换算而来。
        </p>
        <div className="mt-4 rounded-lg border border-line bg-paper p-4 text-[12.5px]">
          <div className="text-ink-muted">
            本次快照：更新于{" "}
            <span className="text-ink">{formatDate(dataset.meta.leaderboardDate)}</span>，
            共 {dataset.meta.totalRows.toLocaleString("zh-CN")} 条排名记录、
            {dataset.meta.modelCount} 个模型、{dataset.meta.vendorCount} 家厂商。
          </div>
          <div className="mt-1 text-ink-faint">
            生成本页面的数据快照时间：{formatDate(dataset.meta.generatedAt)}
          </div>
        </div>
      </Section>

      <Section title="榜单维度">
        <p>
          原始数据包含多个评测分类，本站保留了其中 {boardKeys.length} 个对中文用户最有参考价值的维度：
        </p>
        <ul className="mt-3 space-y-2">
          {boardKeys.map((k) => (
            <li key={k} className="flex gap-3">
              <span className="w-24 shrink-0 text-ink-soft">{dataset.boards[k].label}</span>
              <span className="text-ink-muted">
                {boardDescription(k)}（{dataset.boards[k].entries.length} 个模型）
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="排名规则">
        <ul className="space-y-2.5">
          <li>
            <span className="text-ink-soft">主榜单：</span>
            直接采用 LMArena 的 Elo 排名，不做二次加工。
          </li>
          <li>
            <span className="text-ink-soft">综合榜与中文榜互不干涉：</span>
            同一个模型在不同榜单的名次可以差很多，这正是分类榜单的意义。
          </li>
          <li>
            <span className="text-ink-soft">性价比榜：</span>
            综合价格 = 输入价 × 25% + 输出价 × 75%；能力增量 = Elo − 1000；
            性价比 = 综合价格 ÷ 能力增量，数值越小越划算。
          </li>
          <li>
            <span className="text-ink-soft">开源/闭源：</span>
            依据许可证字段判定，标记为 proprietary 的算闭源，其余算开放权重。
          </li>
        </ul>
      </Section>

      <Section title="局限性">
        <p>这些限制会实质影响你怎么读榜，值得认真看：</p>
        <ul className="mt-3 space-y-2.5">
          <li>
            <span className="text-ink-soft">偏好不等于能力。</span>
            盲测投票衡量的是「人更喜欢哪个回答」，不等于在具体业务任务上更强。
          </li>
          <li>
            <span className="text-ink-soft">票数差异会导致排名不稳。</span>
            票数少的模型置信区间宽，名次容易波动，本站已标注票数供参考。
          </li>
          <li>
            <span className="text-ink-soft">同名模型价格可能对不上。</span>
            排行榜的模型名与 OpenRouter 的挂牌名并非一一对应，约半数模型能匹配到价格，
            其余显示「—」。匹配采用名称归一化后的模糊匹配，偶尔会有偏差。
          </li>
          <li>
            <span className="text-ink-soft">价格是快照不是实时值。</span>
            厂商随时调价，请以官网为准。
          </li>
          <li>
            <span className="text-ink-soft">中文榜的样本量偏小。</span>
            中文分类的投票总数远低于综合榜，参考时更应关注置信区间。
          </li>
        </ul>
      </Section>

      <Section title="署名与更新">
        <p>
          LMArena 数据以 CC-BY-4.0 许可证提供，本站保留其署名。数据通过脚本从公开数据集与
          公开 API 同步，不使用任何私有接口或付费数据。更新频率取决于上游发布节奏，通常为每周一次。
        </p>
      </Section>

      <div className="mt-10 border-t border-line pt-6">
        <Link href="/" className="text-[13px] text-brand hover:text-brand">
          ← 返回榜单
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-[15px] font-semibold text-ink-soft">{title}</h2>
      <div className="mt-3 text-[13px] leading-[1.75] text-ink-muted">{children}</div>
    </section>
  );
}

function boardDescription(key: string): string {
  const map: Record<string, string> = {
    overall: "全部正面对战的总排名，样本量最大",
    chinese: "中文提问场景下的对战排名",
    coding: "编程与代码相关任务",
    creative_writing: "创意写作与文本生成",
    hard_prompts: "高难度问题上的表现",
    expert: "需要专业知识的问题",
    english: "英文提问场景",
    industry_business_and_management_and_financial_operations: "商业、管理与金融场景",
  };
  return map[key] ?? "该维度的对战排名";
}

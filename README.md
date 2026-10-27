# 模型榜

中文大模型能力排行榜。汇总 LMArena 人类盲测对战数据与 OpenRouter 定价信息，提供多维榜单、模型对比与性价比分析。

**线上地址：https://0lcx0.github.io/nixiang/**

## 部署

推送到 `main` 分支即自动构建并部署到 GitHub Pages（见 `.github/workflows/deploy.yml`）。
站点为纯静态导出（`output: "export"`），无需服务器。

`basePath` 由 `next.config.ts` 从 `GITHUB_REPOSITORY` 推导，因此在 GitHub Actions
中构建会自动带上 `/nixiang` 前缀；本地开发保持根路径。

首次启用 Pages 需要在仓库 Settings → Pages 中把 Source 设为 **GitHub Actions**。

## 开发命令

```bash
npm run dev      # 开发服务器（http://localhost:3000）
npm run build    # 生产构建（输出静态文件到 out/）
npm run start    # 仅本地预览生产版本（静态导出后不可用，改用 npx serve out）
npm run lint     # ESLint 检查
npm run sync     # 重新同步榜单数据
```

> 本项目的 Node 版本需 ≥ 22.23.4（REA 与部分依赖的要求）。如果系统 Node 不满足，
> 可用 `/opt/homebrew/opt/node@24/bin` 提供的 Node 24。

## 技术栈

- Next.js 16（App Router + Cache Components + Partial Prefetching）
- React 19
- Tailwind CSS 4
- TypeScript

## 数据来源

| 数据 | 来源 | 许可证 |
|---|---|---|
| Elo 评分、排名、票数 | [LMArena](https://lmarena.ai) 官方排行榜数据集 | CC-BY-4.0 |
| 价格、上下文窗口、推理标记 | [OpenRouter](https://openrouter.ai) 公开模型 API | 公开数据 |

数据通过 `scripts/sync-data.mjs` 从上述公开源拉取，合并后写入 `src/data/leaderboard.json`。
脚本包含限流退避与名称模糊匹配（LMArena 的 `(High)` 档位后缀与 OpenRouter 的
`(batch)`、日期快照后缀需要归一化）。

### 数据快照

当前数据规模：

- 418 个模型、29 家厂商
- 8 个榜单维度：综合、中文、编程、创意写作、高难度、专家任务、英文、金融与商业
- 约 45% 的模型能匹配到 OpenRouter 价格，其余显示「—」

## 页面结构

| 路由 | 内容 |
|---|---|
| `/` | 主榜单，支持维度切换、开源/闭源/推理模型筛选、搜索与多字段排序 |
| `/models/[slug]` | 模型详情：各榜单排名、指标卡、性价比分析（418 个静态页面） |
| `/compare` | 最多 4 个模型的逐项对比 |
| `/value` | 性价比榜，按「每分 Elo 成本」排序 |
| `/methodology` | 数据来源、排名规则与局限性说明 |

榜单切换为客户端状态（静态导出不支持服务端读取 searchParams），
页面本身仍是预渲染的静态 HTML。

## 设计约定

- 深色主题，`ink-*` 为中性色阶，`accent-*` 为主色，`teal` 标记开源，`gold` 用于榜首
- 数字统一使用 `.tabular` 类保证纵向对齐
- 图表用手写 SVG，不引入图表库，避免额外体积
- 浮点坐标必须取整后再输出，否则服务端与客户端计算末位差异会触发 hydration 报错

## 已知限制

- 盲测偏好不等于业务能力，票数少的模型排名波动大
- 中文榜样本量明显小于综合榜
- 约半数模型无法匹配到定价，属上游命名差异所致
- 价格为抓取时快照，厂商调价后需重新运行 `npm run sync`

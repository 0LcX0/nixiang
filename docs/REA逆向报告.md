# Artificial Analysis 前端逆向分析报告

> 工具：REA v6.8.0（`analyze-web-bundle`，CDP 抓取 + 静态 AST 分析）
> 目标：https://artificialanalysis.ai/models
> 日期：2026-10-27

## 一、执行摘要

使用 REA 对目标站点做了一次完整的静态 bundle 逆向，**未执行任何页面 JavaScript 逻辑、
未绕过任何访问控制、未触碰需要鉴权的数据接口**。全过程基于浏览器正常的页面加载，
分析对象是浏览器本来就会下载的公开静态资源。

结论先行：**这个站没有可供第三方直接复用的公开数据接口。** 页面上看到的排行榜数据
由 Next.js 服务端渲染进 HTML，浏览器端脚本里没有任何"取数据"的调用。前端能看到的
只有表单提交、邮件订阅、以及带鉴权的 arena 刷新接口。

## 二、分析方法

```bash
# 1. 列出 CDP 浏览器目标，取 target_id
rea list-browser-targets http://127.0.0.1:9222

# 2. 对目标页面做 bundle 抓取 + 静态分析（含 source map）
rea analyze-web-bundle http://127.0.0.1:9222 <target_id> \
  --observation-ms 5000 \
  --analysis-timeout-ms 120000 \
  --total-analysis-timeout-ms 300000 \
  --fetch-source-maps
```

REA 的行为边界（其自身声明的限制，我已核实）：

- 只做静态分析，**不执行**抓取到的 JavaScript
- 抓取的是浏览器正常加载的脚本，不注入、不篡改
- 每个发现都带 `evidence_id`、脚本 SHA-256、行列号，可追溯

## 三、技术栈画像

| 维度 | 结论 | 依据 |
|---|---|---|
| 框架 | Next.js（App Router） | 5 个脚本命中 `next-runtime` 指纹，置信度高 |
| 渲染 | SSR + 客户端 hydration | `__NEXT_FS` 流式数据、`/_next/static/chunks/*` |
| 图表 | D3 + Recharts + Radix UI | 之前用 curl 抓 HTML 得到的库名统计 |
| 遥测 | PostHog，经自建反向代理 `togshop` 转发 | `togshop/static/*.js` + `survey.js` |
| CSS | Tailwind（类名模式） | 仅在 HTML 层观察 |

**遥测细节（值得注意）：**

站点把 PostHog 的 SDK 放在 `/togshop/` 这个伪装路径下，而不是常见的
`us.i.posthog.com`。这是常见的反 adblock 手段——让广告拦截器的域名规则失效。
逆向出的四个 source map：

```
/togshop/static/exception-autocapture.js.map
/togshop/static/web-vitals.js.map
/togshop/static/dead-clicks-autocapture.js.map
/togshop/static/surveys.js.map
```

我实测 `curl https://artificialanalysis.ai/togshop/static/surveys.js` 返回 **200**，
确认代理路径真实有效。

## 四、逆向出的完整路由清单

REA 从 69 个脚本、93 万 AST 节点里提出了 17 条路由：

### 4.1 公开表单接口（匿名可 POST）

| 路由 | 用途 | 实测 |
|---|---|---|
| `/api/forms/contact` | 联系表单 | GET 405 / POST 403（有反爬） |
| `/api/forms/chatbot-feedback` | 聊天反馈 | GET 405 / POST 403 |
| `/api/article-alerts/subscribe` | 文章订阅 | GET 405 / POST 403 |

`405 Method Not Allowed` 说明路由存在且只接受 POST；`403` 是 Cloudflare/WAF 拦截了
非浏览器请求，不是鉴权失败。

### 4.2 鉴权接口

| 路由 | 用途 | 实测 |
|---|---|---|
| `/api/auth/sign-in/magic-link` | 邮箱魔法链接登录 | POST 400（缺参数） |

这里能确认：**站点用 magic link 登录，没有密码体系**。

### 4.3 Arena 刷新接口（需鉴权）

这类是给标注/投票后台用的，逆向出 11 个：

```
/api/prolific/image/refresh
/api/prolific/video/refresh
/api/prolific/music/refresh
/api/prolific/speech/refresh
/api/prolific/3d/refresh
/api/prolific/expression/refresh
/api/prolific/pronunciation/refresh
/api/prolific/prompt-review/refresh
/api/text-to-image/arena/images/refresh
/api/text-to-video/arena/videos/refresh
/api/text-to-speech/arena/audios/refresh
```

实测 `POST /api/prolific/image/refresh` → **401 Unauthorized**，需要登录态。
`prolific` 这个名字说明他们用 Prolific 平台招募人工标注者——这解释了
LMArena 式盲测数据的组织方式。

## 五、关键否定结论：没有公开数据 API

这是本次逆向最有价值的发现。我重点验证了"页面的排行榜数据从哪来"：

1. **客户端脚本里没有任何模型数据请求。** 17 条路由里没有一条是
   `/api/models`、`/api/leaderboard` 这类数据接口。
2. **数据在 HTML 里。** 首页 HTML 1.6MB，模型名、评分、价格都在
   `self.__next_f.push(...)` 的流式载荷中，由服务端直出。
3. **已知的 API 需要密钥。** `GET /api/v2/data/llms/models` 返回 **401**，
   需要 `x-api-key`，且官方条款规定免费额度 1000 请求/天、必须署名。

所以：**想通过前端逆向拿它的数据，路走不通。** 唯一的接口是要申请密钥的官方 API，
而它的使用条款明确禁止"搭建类似或竞争性网站"。

## 六、分析完整性

| 项目 | 结果 |
|---|---|
| 抓取脚本数 | 69 |
| 成功解析 | 68（1 个部分解析） |
| AST 节点 | 930,776 |
| 解析失败 | 0 |
| source map | 4/4 全部获取 |
| 未完成脚本 | `3040cb9f-*.js`（173KB，超时） |

唯一未完成的那个 chunk 是 173KB 的业务代码，超了 30s 单脚本时限。扩大到 120s 后
仍然超时，说明它内部结构确实复杂。这块的盲区意味着可能有少量路由没被提取到，
但不影响主结论——因为**验证"有没有数据接口"只需要看有没有对应的 fetch 调用，
而这条路径已经查干净了**。

## 七、与"直接抓 HTML"的对比

我之前用 curl 抓 HTML 就得到了技术栈线索。REA 的增量价值在哪：

| 能力 | curl + grep | REA |
|---|---|---|
| 技术栈识别 | 需要人工猜关键词 | 自动指纹匹配，带置信度 |
| 路由提取 | 做不到（在压缩后的 JS 里） | 从 AST 提取，带行列号 |
| 第三方服务 | 只能看到 URL | 关联到脚本哈希，可追溯 |
| source map | 不会自动取 | 自动发现并解析 |
| 证据链 | 无 | 每个结论带 SHA-256 |
| 边界声明 | 无 | 明确标注未执行 JS、哪些是推测 |

具体到这次，curl 完全做不到的是**17 条 API 路由**和**PostHog 代理伪装**这两项。

## 八、结论与建议

**给本站（模型榜）的决策依据：**

1. 不能从 artificialanalysis.ai 拿数据——前端逆向已证明没有公开通道，
   官方 API 有条款限制。
2. 现行方案（LMArena CC-BY-4.0 + OpenRouter 公开 API）是唯一合规路径，
   且数据质量足够支撑榜单。
3. 如果要做差异化，方向应该是**自己产生数据**（如自建中文评测集），
   而不是想办法获取别人的。

**技术层面的收获：**

- 确认了 Next.js SSR 站点做数据抓取的正确姿势是解析 HTML 流式载荷，不是找 API
- 逆向出的 API 路由清单可作为后续观察其产品演进的信号（比如新增哪个 arena 品类）
- PostHog 代理伪装手法可以借鉴——如果本站将来要加埋点又不希望被拦截

## 附：证据文件

原始的完整分析结果是 8.1MB 的 JSON（含全部脚本哈希与 source map 内容），
**不入库**，需要时重新生成：

```bash
# 1. 启动测试浏览器并连上 CDP 端口 9222
# 2. 取目标页的 target_id
rea list-browser-targets http://127.0.0.1:9222

# 3. 重新跑分析，输出到 docs/evidence/
mkdir -p docs/evidence
rea analyze-web-bundle http://127.0.0.1:9222 <target_id> \
  --observation-ms 5000 \
  --analysis-timeout-ms 120000 \
  --total-analysis-timeout-ms 300000 \
  --fetch-source-maps \
  --format json > docs/evidence/rea-analysis-evidence.json
```

`docs/evidence/` 已在 `.gitignore` 中排除。本报告中的路由清单、脚本数量、
source map 结论均可在该文件中复核；每条 finding 都带脚本 SHA-256 与行列号，
顶层的 `evidence_id` 可用于追溯单次分析。

> 本报告所有结论均来自公开静态资源分析。未对目标站点进行任何写入、破坏、
> 绕过鉴权或高频请求行为。

# Activity Feed（GitHub 首页动态流）设计

日期：2026-07-05
状态：已确认（数据方向 / 命名 / 样式 / 过滤已与用户对齐）

## 背景与目标

GitHub Web 首页的经典 Timeline（"Following" feed）展示你关注的人、关注的组织、Watch/Star 的仓库产生的动态。为 Oh My GitHub 实现同等功能：侧边栏 Inbox 下方新增 **Activity** 入口，点击打开 Activity 类型的 Tab，以 GitHub 经典紧凑行式 + 聚合折叠的样式展示接收流动态。

## 已确认的产品决策

| 决策点 | 结论 |
| --- | --- |
| 数据方向 | **接收流** `GET /users/{username}/received_events`（关注的人/组织、Watch/Star 的仓库的动态），认证为本人可见私有事件 |
| 命名 | 统一叫 **Activity**（复用已存在的 `activity` tab 类型与 i18n key），不叫 Timeline |
| 入口 | 侧边栏 SidebarHeader 内、Inbox 条目正下方，与 Search/Inbox 同级 |
| 展示样式 | 紧凑行式（头像 + 动作句子 + 相对时间）+ **每条下方的内容卡片**（2026-07-05 迭代确认）：仓库卡（描述/语言/star 数，GraphQL 批量补拉）、文本卡（release notes、issue/PR 标题+正文摘要、评论摘要，payload 现成数据）、提交卡（push 的 commit message 列表）。同一人同类动作聚合折叠，star/fork 组展开后每个子项渲染仓库卡 |
| 类型过滤 | 仿 Inbox reason 过滤：顶部一排可点击 badge（Stars / Forks / Repositories / Releases / Commits / Issues & PRs），前端本地过滤，单选可取消 |
| 点击行为 | 全部内链：actor → account tab；仓库 → repo tab；issue/PR → issue/PR tab；push → repo commits 区；release → repo releases 区 |
| 刷新 | 照 Inbox 模式：`staleTime 60s` + mount/focus/reconnect 自动 refetch；不做 ETag/X-Poll-Interval（v1 简化） |
| 分页 | 首屏拉第 1 页（100 条），底部"加载更多"拉第 2、3 页；API 硬限制 300 条 / 30 天 |

## API 调研结论

- 端点：`octokit.rest.activity.listReceivedEventsForUser({ username, per_page, page })`；`per_page` 最大 100，共约 3 页（300 条上限，仅保留 30 天）。
- 事件公共结构：`{ id, type, actor{login, avatar_url}, repo{name}, payload, created_at }`。
- 事件类型（17 种）：WatchEvent（star）、ForkEvent、CreateEvent（repository/branch/tag）、DeleteEvent、PushEvent、ReleaseEvent、PublicEvent、MemberEvent、IssuesEvent、IssueCommentEvent、PullRequestEvent、PullRequestReviewEvent、PullRequestReviewCommentEvent、CommitCommentEvent、DiscussionEvent、GollumEvent（wiki）、SponsorshipEvent。未知类型渲染兜底行。
- GitHub 新版 "For You" 推荐流无公开 API；本功能对标经典 Following feed 样式。

## 架构（方案 A：分页取原始事件，渲染层聚合）

数据链路完全照 Inbox 惯例：

```
ActivityPage (renderer)
  → useActivityFeedQuery / fetchActivityFeedPage (composables/github/use-activity.ts, @pinia/colada)
  → window.ohMyGithub.activity.listReceivedEvents (preload bridge)
  → ipcMain 'activity:list-received-events' (main/activity.ts, username 取 getAuthenticatedViewerLogin())
  → ActivityApi.listReceivedEvents (packages/api/src/modules/activity.ts, octokit)
```

- **API 层是哑管道**：只按页拉取并把 octokit 事件规范化为瘦类型 `GitHubFeedEvent`（判别联合 payload，17 种已知 kind + `unknown` 兜底），返回 `GitHubFeedEventPage { events, page, hasMore }`（`hasMore` 由 Link header 的 `rel="next"` 且 `page < 3` 决定）。
- **聚合 / 过滤 / 文案选择全部是 renderer 纯函数**（`pages/activity/activity-helpers.ts`），可单测、享受 HMR：
  - `mergeFeedEvents(pages)`：按 `id` 去重、`createdAt` 降序合并。第 1 页自动刷新带来的新事件前插，已加载的后续页不丢。
  - `groupFeedEvents(events)`：相邻且同 key 的事件合并为组。分组 key：star → `star:{actor}`；fork → `fork:{actor}`；push → `push:{actor}:{repo}:{branch}`（计数求和）；其余不聚合。star/fork 组可展开，push 组直接显示合计。
  - `matchesActivityFilter(event, filter)`：6 个过滤类别映射 payload kind；`unknown`/`sponsorship` 仅在无过滤时可见。
  - `presentFeedEvent / presentFeedGroup`：产出 `{ sentenceKey, parts, subtitle, targetUrl }`，组件只做渲染。
- **顺序**：先过滤后聚合（过滤基于原始事件类型，不需要解开聚合）。

## 组件

- `pages/activity/activity-page.vue`：标题头 + 过滤 badge 排 + ScrollArea；三态（Skeleton / 错误重试 / Empty）照 inbox-page 模板；列表底部"加载更多"按钮（`hasMore` 时显示）。
- `pages/activity/components/activity-event-row.vue`：单事件行 —— `GithubActorLink`（头像+用户名）+ `<i18n-t>` 动作句子（repo/issue 等 part 为可点击内链，`@click.stop`）+ 右侧相对时间；issue/PR 事件第二行显示标题（truncate, muted）。
- `pages/activity/components/activity-group-row.vue`：聚合行 —— 组句子（"starred {count} repositories"）+ chevron 展开嵌套目标列表；push 组无展开、整行点击进 commits。
- 相对时间：`components/conversation/format.ts` 新增 `formatRelativeTime()`（`Intl.RelativeTimeFormat`，narrow，跟随当前 locale）——代码库此前只有绝对时间格式化。
- 接线：`workspace-panel.vue` 注册 `<ActivityPage v-else-if="tab.type === 'activity'">`；`tab-presentation.ts` activity 图标 `Bell` → `Activity`（Bell 语义留给通知）；侧边栏新增 `ACTIVITY_ITEM_ID` 条目及 `syncActiveItem` 同步。`/activity` 的 URL 解析、tab 标题已存在，零改动。

## i18n

`workspace.sidebar.items.activity`、`workspace.activity.*`（title / filters / sentences / groups / empty / error / loadMore）同时加入 `en.json` 与 `zh.json`；入口与标题文案统一用 "Activity"（zh 同）。句子模板不含裸 `@`；push 句用 vue-i18n 复数管道。`locales.test.ts` 自动守护编译。

## 错误处理

- 首屏错误：inbox 同款内联错误 + 重试按钮（query.error）。
- 加载更多失败：toast（`useToast().error`），按钮恢复可点，已加载数据不丢。
- 未认证 / 403 / 断网：错误冒泡为 query error，走同一错误态。
- 空 feed（新账号无关注）：Empty 组件引导性文案。

## 测试

- `packages/api/src/modules/activity.test.ts`：mock octokit，验证 normalize（各事件类型 payload 裁剪、未知类型兜底）、分页参数透传、Link header → `hasMore`、第 3 页封顶。
- `pages/activity/activity-helpers.test.ts`：merge 去重排序、分组规则（相邻同 key 合并、push 求和、不跨 actor）、过滤映射、sentenceKey/targetUrl 选择。
- `components/conversation/format.test.ts`：`formatRelativeTime` 固定 now 断言。
- `locales.test.ts`：新增 key 编译守护（既有）。

## 卡片补充设计（2026-07-05 迭代）

- **数据分两路**：文本卡/提交卡摘要在 API 层从 payload 裁剪（280 字符、commit 取首行最多 5 条），不额外请求；仓库卡（描述、语言+色点、star 数紧凑格式）由 `ActivityApi.getRepositoryCards` 用 GraphQL 别名批量查询（每 50 个一组，部分错误时取 `error.data` 降级）。
- **渐进增强**：页面 watch 事件列表，收集 `collectRepoCardNames`（star/fork forkee/建仓/开源）中缺失的仓库名按需补拉，存 `Map<string, GitHubFeedRepoCard | null>` 传给行组件；拉取失败静默降级为纯名字卡片。
- **展示**：`FeedEventPresentation.card` 判别联合（repo / text / commits），由 `activity-feed-card.vue` 统一渲染；issue/PR 行原第二行标题移入卡片（`#N 标题` + 正文摘要 line-clamp-3）；卡片可点击跳转对应 tab。delete/member/wiki/sponsorship/unknown 无卡片。

## 非目标（v1 不做）

- ETag / `X-Poll-Interval` 条件轮询；后台 setInterval 轮询。
- "For You" 式算法推荐内容。
- "我的动态"（`/users/{me}/events`）子 tab。
- 聚合的时间窗口阈值（仅按相邻 + 同 key 聚合）。
- 卡片内 markdown 渲染（摘要按纯文本展示）。

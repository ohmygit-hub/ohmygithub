# Teams 功能设计

日期：2026-07-14
状态：已与开发者逐节确认

## 目标与范围

为 Oh My GitHub 补齐 GitHub Teams（团队）能力：浏览 + 完整管理。

- 组织档案页新增 Teams 分区（团队列表，按层级展示）
- 新增独立的 Team 详情标签页（成员 / 仓库 / 子团队 / 设置）
- 完整管理操作：创建 / 编辑 / 删除团队、增删成员、maintainer 角色、团队的仓库授权
- 层级支持：展示父子层级、创建时可选父团队；**不做**事后调整层级（修改父团队）
- 一并补齐两个现有缺口：仓库设置 Teams 面板的团队选择器（替换手输 slug）、PR 审查者中的 Team 可点击跳转

不在范围内：团队讨论（GitHub 已弃用）、修改父团队 / 移动层级、组织级 People 页面的改动。

## 数据层选型

**GraphQL 读 + REST 写**，与 `organization-people.ts` 既有模式同构：

- 读取用 GraphQL 一次带回层级、角色、权限信息与 `viewerCanAdminister`
- 写操作走 Octokit REST（GitHub GraphQL 无团队 CRUD mutation，写只能走 REST）
- OAuth：默认 scope 已含 `admin:org`，读写均已覆盖；旧 token 缺 scope 时显式提示（见「权限与错误处理」）

## 第 1 节：数据与 API 层

### 类型（`packages/api/src/types.ts`）

- `GitHubTeamPrivacy = 'visible' | 'secret'`
- `GitHubTeam`：`id`（databaseId，REST 创建子团队需要 `parent_team_id`）、`slug`、`name`、`description`、`privacy`、`org`、`parentSlug` / `parentName`、`membersCount`、`reposCount`、`childTeamsCount`、`avatarUrl`
- `GitHubOrganizationTeams`：`teams: GitHubTeam[]`（平铺全量 + parent 引用，层级由渲染层组装）、`viewerCanAdminister`、`totalCount`、`truncated` —— 与 `GitHubOrganizationPeople` 同构
- `GitHubTeamMember`：`login`、`name`、`avatarUrl`、`role: 'member' | 'maintainer'`
- `GitHubTeamRepository`：`owner`、`name`、`permission`、`private`、`description`
- `GitHubTeamDetail`：`team`、`members`、`repositories`、`childTeams`、`viewerCanAdminister`（取 GraphQL `Team.viewerCanAdminister`：org owner 与该团队 maintainer 均为 true，权限门控天然覆盖两种身份）
- 写操作 Options 类型：`CreateTeamOptions`（org、name、description?、privacy?、parentTeamId?）、`UpdateTeamOptions`（name/description/privacy）、`DeleteTeamOptions`、`SetTeamMembershipOptions`（含 role）、`RemoveTeamMemberOptions`、`AddOrUpdateTeamRepositoryOptions`（含 permission）、`RemoveTeamRepositoryOptions`

### 模块（`packages/api/src/modules/organization-teams.ts`）

`OrganizationTeamsApi` 类，逐字效仿 `OrganizationPeopleApi`：

- 读（GraphQL，分页循环 + 截断上限 + `truncated` 标记）：
  - `getTeams(org)`：`organization.teams` 平铺全量，含 `parentTeam`
  - `getTeamDetail(org, slug)`：一次带回成员 + 角色、仓库 + 权限、子团队、父团队、`viewerCanAdminister`
- 写（Octokit REST）：
  - `createTeam`：`POST /orgs/{org}/teams`（含 `parent_team_id`）
  - `updateTeam`：`PATCH /orgs/{org}/teams/{team_slug}`（name / description / privacy）
  - `deleteTeam`：`DELETE /orgs/{org}/teams/{team_slug}`
  - `setTeamMembership`：`PUT /orgs/{org}/teams/{team_slug}/memberships/{username}`（含 maintainer 角色）
  - `removeTeamMember`：`DELETE` 同路径
  - `addOrUpdateTeamRepository`：`PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}`（含 permission）
  - `removeTeamRepository`：`DELETE` 同路径

### 贯通链路（每层与 organization-people 平行）

1. `GitHubClient` 接口加上述方法；`MockGitHubClient` 补 mock 数据（见「Mock」）
2. main 进程新增 `organization-teams` 域模块，注册 `organization-teams:*` IPC handler
3. preload 暴露 `organizationTeams` 命名空间窄方法；`env.d.ts` 同步返回类型
4. 渲染层 `composables/github/use-organization-teams.ts`：
   - `useOrganizationTeamsQuery(org)`、`useTeamDetailQuery(org, slug)`
   - 各 mutation 封装
   - `useTeamInvalidation()`：按 house 规则 `invalidateQueries(..., 'all')` 刷新未挂载列表

查询键：`['github', 'organization-teams', org]`、`['github', 'team-detail', org, slug]`。缓存策略照抄 organization-people：staleTime 5 分钟、gcTime 30 分钟、`refetchOnMount: false`。

## 第 2 节：组织档案页的 Teams 分区

### 入口

- `AccountTabId` 增加 `'teams'`；仅组织档案显示（与 `people` 相同的 `isOrganizationProfile` 门控，用户档案不显示）
- URL 解析：`github.com/orgs/{org}/teams` 打开组织档案页并定位 Teams 分区（`workspace-url` / `workspace-github-url` 及其测试同步补）

### 分区内容（新组件 `account-teams-section.vue`，与 `account-people-section.vue` 并列）

- 顶部一行：搜索框（按名称 / slug / 描述过滤，团队数 ≤ 8 时隐藏）+「新建团队」按钮（仅 `viewerCanAdminister` 显示，同行等高）
- 团队列表按层级树展示：根团队顶层，子团队缩进、可展开收起。每行：团队名、slug、描述（截断）、`secret` 徽章（仅私密团队标注）、成员数、仓库数。整行点击打开 Team 详情标签页
- 空态持框（「该组织还没有团队」+ 管理员可见的新建按钮）；加载态骨架同形，不跳版
- 缺权限（旧 token 缺 `read:org` / `admin:org`）→ 显式缺权限状态 + 重新授权引导，不静默藏数据

### 创建团队对话框（house 标准表单形态）

- 字段：名称（必填）、描述（可选，标注在 label）、可见性（`visible` / `secret` Select，默认 `visible`）、父团队（可选，Combobox 从当前组织团队列表选择）
- 从子团队分区「新建子团队」打开时父团队预填
- 成功后失效 `organization-teams` 并打开新团队详情标签页；失败 toast 报错

## 第 3 节：Team 详情标签页

### 标签页与 URL

- 新增 `WorkspaceTabType 'team'`；`WorkspaceTab` / `WorkspaceBookmark` 增加 `teamSlug` 字段（支持书签）
- URL 双向映射 `github.com/orgs/{org}/teams/{slug}`；子路径 `/members`（默认）、`/repositories`、`/teams` 映射对应分区
- `tab-presentation.ts` 补标题与图标（lucide `Users`）

### 页面结构（`pages/team/team-page.vue`，效仿 account-page「头部 + 分区」形态）

- 头部：团队头像、名称、slug、`secret` 徽章、描述；父团队为可点击链接（跳其详情页）；「在 GitHub 上查看」入口
- 分区：成员 / 仓库 / 子团队 / 设置（设置仅 `viewerCanAdminister` 显示）

### 成员分区

- 列表：头像、login、姓名、`maintainer` 徽章
- 管理操作（仅可管理者）：「添加成员」（Combobox 搜索组织成员，复用 `useOrganizationPeopleQuery`，可选 maintainer 角色）、行内改角色（member ↔ maintainer）、移除成员（确认后执行）

### 仓库分区

- 列表：仓库名（可点击打开仓库标签页）、私有徽章、当前权限
- 管理操作：「添加仓库」（Combobox 数据源为既有的 `listOrganizationRepositories` + 权限 Select）、行内改权限（pull / triage / push / maintain / admin，复用仓库设置 Teams 面板的角色文案）、移除访问（确认后执行）

### 子团队分区

- 直接子团队列表（名称、成员数），点击跳详情
- 可管理者见「新建子团队」（创建对话框、父团队预填）
- 无子团队时列表持框空态

### 设置分区（仅可管理者）

- 名称、描述、可见性的编辑表单（手动保存）
- 底部危险区「删除团队」：确认对话框明确提示子团队将被提升为根团队，`destructive` 按钮 + 二次确认
- 不提供修改父团队（超出范围）

### 缓存策略

- 所有 mutation 成功后同时失效 `team-detail` 与 `organization-teams`（`'all'`）
- 删除团队后关闭当前标签页并回到组织档案 Teams 分区

## 第 4 节：现有缺口补齐

### 仓库设置 → 访问权限 → Teams 面板

- 手输 slug 输入框换成 Combobox，数据源 `useOrganizationTeamsQuery(仓库 owner 组织)`
- 按名称 / slug 搜索，显示团队名 + slug；已有访问权的团队从候选排除
- 仅仓库 owner 为组织时启用；原有权限 Select 与移除逻辑不动

### PR 审查者中的 Team

- 侧边栏 Team 审查者由纯展示改为可点击，点击打开对应 Team 详情标签页（org 取当前仓库 owner）
- 仅接上 workspace 的 URL 打开机制，无数据层改动

## 横切关注点

### 权限与错误处理

- 管理操作一律以 `viewerCanAdminister` 门控**隐藏**（非禁用），非管理者看到纯浏览视图——与 organization-people 一致
- 旧 token 缺 scope → Teams 分区显式缺权限状态 + 重新授权引导（项目 OAuth 政策）
- secret 团队可见性由 GitHub API 天然裁剪，前端不做额外判断
- mutation 失败 toast 报错并保持原状态；自动刷新不做成功 toast

### i18n

- `en.json` 与 `zh.json` 同批补齐全部新 key（分区、详情页、创建 / 删除对话框、角色与可见性文案、空态、缺权限态）
- 权限角色文案复用现有 `repository.settings.access.roles`

### Mock

- `MockGitHubClient` 补含两层层级、secret 团队、不同角色成员的团队数据，未登录 / mock 模式下全流程可走通

### 验证

- `pnpm typecheck`
- `pnpm --filter @oh-my-github/client build`
- `workspace-url.test.ts` 补 teams URL 解析用例

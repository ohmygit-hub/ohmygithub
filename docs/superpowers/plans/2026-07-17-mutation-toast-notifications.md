# Mutation Toast Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every user-triggered mutation in the renderer gives explicit toast feedback — success toasts for deliberate actions, error toasts where failures are currently swallowed silently.

**Architecture:** Reuse the existing `useToast()` composable (`packages/client/src/renderer/composables/use-toast.ts`) backed by the `@oh-my-github/ui` Toaster already mounted in `app.vue`. Add toast calls at the component call sites (not inside the `use-*.ts` composables, which lack user-action context). All copy goes through `vue-i18n` with both `en` and `zh` locales.

**Tech Stack:** Vue 3 `<script setup>`, vue-i18n, `@oh-my-github/ui` toast.

## Global Constraints

- All user-facing text via i18n keys, added to BOTH `en.json` and `zh.json`.
- zh copy keeps product terms untranslated (Pull Request, Issue, Review, Reviewer, Star), success uses 「已……」, errors use 「……失败，请重试。」/「无法……，请重试。」 with full-width punctuation.
- Follow the design contract (packages/client/CLAUDE.md § Save model & feedback): success toasts only for explicit deliberate actions; errors always surface; no toasts for ambient/optimistic micro-interactions.
- Do NOT touch the in-flight PR review-thread work (`addPullRequestReviewThread`, `submitPendingPullRequestReview`, `deletePendingPullRequestReview` — currently unconsumed; another change in progress owns `packages/api`).
- Validation: `pnpm typecheck` and `pnpm --filter @oh-my-github/client build`. No new test files (renderer has no component-test harness for toast wiring; existing toast integrations shipped the same way).
- Commit only files this plan touches (the user has unrelated in-flight changes in `packages/api`).

## Decision Rules (which call sites get what)

1. **Explicit deliberate mutation → success toast.** Post/edit comment, edit title/body/labels/assignees/milestone, add/remove reviewer, merge/close/ready-for-review, submit review, close/reopen/delete issue, subscribe/lock/pin.
2. **Errors always surface.** Where an inline error already exists (comment composers, markdown editors, merge dialog, review tab, title editors), keep it — add only the success toast. Where errors are currently swallowed (`try/finally` without `catch`, empty `catch`), add an error toast.
3. **In-place toggles with instant visual state + existing house pattern → error toast only.** Star/watch/follow toggles, inbox mark-read, reactions. (Watch already does exactly this: `repository.watch.error`.)
4. **Already covered — no change:** releases, packages, branches/tags, workflow dispatch/rerun, new repository, fork (parent toasts success), org people/teams, all settings pages, inbox, activity, workspace copy/open.

## Full Inventory & Copy

| # | Action | File | Today | Change | en | zh |
|---|--------|------|-------|--------|----|----|
| 1 | Post PR comment | pull-request-page.vue | inline error only | +success | Comment posted | 评论已发布 |
| 2 | Edit PR description | pull-request-page.vue | inline error only | +success | Description updated | 描述已更新 |
| 3 | Edit PR comment | pull-request-page.vue | inline error only | +success | Comment updated | 评论已更新 |
| 4 | Toggle reaction (PR) | pull-request-page.vue | silent error | +error | Couldn't update reaction. Please try again. | 无法更新表情回应，请重试。 |
| 5 | Edit PR title | pull-request-header.vue | inline error only | +success | Title updated | 标题已更新 |
| 6 | PR subscribe/unsubscribe | pull-request-header.vue | silent both | +success +error | Subscribed to notifications / Unsubscribed from notifications | 已订阅通知 / 已取消订阅通知 |
| 7 | PR lock/unlock | pull-request-header.vue | silent both | +success +error | Conversation locked / unlocked | 对话已锁定 / 对话已解锁 |
| 8 | PR assignees | pull-request-sidebar.vue | silent both | +success +error | Assignees updated | 负责人已更新 |
| 9 | PR labels | pull-request-sidebar.vue | silent both | +success +error | Labels updated | 标签已更新 |
| 10 | PR milestone | pull-request-sidebar.vue | silent both | +success +error | Milestone updated | 里程碑已更新 |
| 11 | Request/remove reviewers | pull-request-sidebar.vue | silent both | +success +error | Requested review from {logins} / Removed reviewer {logins} | 已添加 Reviewer：{logins} / 已移除 Reviewer：{logins} |
| 12 | Merge PR | pull-request-sidebar.vue | dialog inline error | +success | Pull Request merged | Pull Request 已合并 |
| 13 | Close PR | pull-request-sidebar.vue | inline error | +success | Pull Request closed | Pull Request 已关闭 |
| 14 | Ready for review | pull-request-sidebar.vue | inline error | +success | Marked ready for review | 已标记为 Ready for review |
| 15 | Submit review (3 kinds) | pull-request-review-tab.vue | inline error | +success | Pull Request approved / Changes requested / Review comment submitted | 已批准该 Pull Request / 已请求修改 / Review 评论已提交 |
| 16 | Post issue comment | issue-page.vue | inline error only | +success | Comment posted | 评论已发布 |
| 17 | Edit issue description | issue-page.vue | inline error only | +success | Description updated | 描述已更新 |
| 18 | Edit issue comment | issue-page.vue | inline error only | +success | Comment updated | 评论已更新 |
| 19 | Toggle reaction (issue) | issue-page.vue | silent error | +error | (same as #4) | 同 #4 |
| 20 | Edit issue title | issue-header.vue | inline error only | +success | Title updated | 标题已更新 |
| 21 | Issue subscribe / lock / pin | issue-header.vue | silent both | +success +error | (as #6/#7) + Issue pinned / Issue unpinned | 同 #6/#7 + Issue 已置顶 / Issue 已取消置顶 |
| 22 | Delete issue | issue-header.vue | silent both | +success +error | Issue deleted / Failed to delete issue. Please try again. | Issue 已删除 / 删除 Issue 失败，请重试。 |
| 23 | Issue assignees/labels/milestone | issue-sidebar.vue | silent both | +success +error | (as #8–#10) | 同 #8–#10 |
| 24 | Close issue (completed / not planned), reopen | issue-sidebar.vue | silent both | +success +error | Issue closed as completed / Issue closed as not planned / Issue reopened | Issue 已关闭为已完成 / Issue 已关闭为不计划 / Issue 已重新打开 |
| 25 | Star/unstar repo | repository-page.vue | silent error | +error only (rule 3) | Couldn't update star. Please try again. | 无法更新 Star，请重试。 |

Shared error keys: `updateFailed` = "Update failed. Please try again." / 「更新失败，请重试。」; `actionFailed` = "Action failed. Please try again." / 「操作失败，请重试。」

---

### Task 1: i18n keys

**Files:**
- Modify: `packages/client/src/renderer/i18n/locales/en.json`
- Modify: `packages/client/src/renderer/i18n/locales/zh.json`

Add a `toasts` object under the existing `pullRequest` and `issue` top-level objects, and `star.error` under `repository`.

- [ ] **Step 1: en.json** — under `pullRequest` add:

```json
"toasts": {
  "commentPosted": "Comment posted",
  "commentUpdated": "Comment updated",
  "bodyUpdated": "Description updated",
  "titleUpdated": "Title updated",
  "assigneesUpdated": "Assignees updated",
  "labelsUpdated": "Labels updated",
  "milestoneUpdated": "Milestone updated",
  "reviewersAdded": "Requested review from {logins}",
  "reviewersRemoved": "Removed reviewer {logins}",
  "merged": "Pull Request merged",
  "closed": "Pull Request closed",
  "readyForReview": "Marked ready for review",
  "reviewApproved": "Pull Request approved",
  "reviewChangesRequested": "Changes requested",
  "reviewCommented": "Review comment submitted",
  "subscribed": "Subscribed to notifications",
  "unsubscribed": "Unsubscribed from notifications",
  "locked": "Conversation locked",
  "unlocked": "Conversation unlocked",
  "updateFailed": "Update failed. Please try again.",
  "actionFailed": "Action failed. Please try again.",
  "reactionFailed": "Couldn't update reaction. Please try again."
}
```

under `issue` add:

```json
"toasts": {
  "commentPosted": "Comment posted",
  "commentUpdated": "Comment updated",
  "bodyUpdated": "Description updated",
  "titleUpdated": "Title updated",
  "assigneesUpdated": "Assignees updated",
  "labelsUpdated": "Labels updated",
  "milestoneUpdated": "Milestone updated",
  "closedCompleted": "Issue closed as completed",
  "closedNotPlanned": "Issue closed as not planned",
  "reopened": "Issue reopened",
  "deleted": "Issue deleted",
  "deleteFailed": "Failed to delete issue. Please try again.",
  "pinned": "Issue pinned",
  "unpinned": "Issue unpinned",
  "subscribed": "Subscribed to notifications",
  "unsubscribed": "Unsubscribed from notifications",
  "locked": "Conversation locked",
  "unlocked": "Conversation unlocked",
  "updateFailed": "Update failed. Please try again.",
  "actionFailed": "Action failed. Please try again.",
  "reactionFailed": "Couldn't update reaction. Please try again."
}
```

under `repository` add `"star": { "error": "Couldn't update star. Please try again." }`.

- [ ] **Step 2: zh.json** — same keys with the zh copy from the inventory table (full-width punctuation, product terms untranslated).

### Task 2: PR conversation page + header

**Files:**
- Modify: `packages/client/src/renderer/pages/pull-request/pull-request-page.vue`
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-header.vue`

- [ ] `pull-request-page.vue`: import `useToast`; `toast.success(t('pullRequest.toasts.commentPosted'))` after comment create; `bodyUpdated` after body save; `commentUpdated` after comment edit; in `toggleReaction`'s empty catch add `toast.error(t('pullRequest.toasts.reactionFailed'))` (keep the refetch-revert comment).
- [ ] `pull-request-header.vue`: import `useToast`; `titleUpdated` success in `saveTitle`; change `runAction(action)` to `runAction(action, successMessage)`:

```ts
async function runAction(action: () => Promise<void>, successMessage: string): Promise<void> {
  if (isBusy.value) return
  isBusy.value = true
  try {
    await action()
    toast.success(successMessage)
    emit('refetch')
  } catch {
    toast.error(t('pullRequest.toasts.actionFailed'))
  } finally {
    isBusy.value = false
  }
}
```

Callers pass `t('pullRequest.toasts.subscribed'/'unsubscribed')` and `locked`/`unlocked` based on the pre-toggle state.

### Task 3: PR sidebar

**Files:**
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-sidebar.vue`

- [ ] `applyUpdate(changes, pendingIds, pending)` gains a `successMessage: string` param; wrap the await in try/catch: success → `toast.success(successMessage)`, catch → `toast.error(t('pullRequest.toasts.updateFailed'))`. Callers pass `assigneesUpdated` / `labelsUpdated` / `milestoneUpdated`.
- [ ] `onReviewersChange`: after refetch, `if (added.length) toast.success(t('pullRequest.toasts.reviewersAdded', { logins: added.join(', ') }))`; same for removed; add `catch` → `updateFailed`.
- [ ] `confirmMerge`: `toast.success(t('pullRequest.toasts.merged'))` on success (keep dialog inline error).
- [ ] `closeCurrentPullRequest`: success → `closed`. `markReadyForReview`: success → `readyForReview` (keep inline errors).

### Task 4: PR review tab

**Files:**
- Modify: `packages/client/src/renderer/pages/pull-request/components/pull-request-review-tab.vue`

- [ ] In `submitReview` success path, toast by event: `APPROVE` → `reviewApproved`, `REQUEST_CHANGES` → `reviewChangesRequested`, `COMMENT` → `reviewCommented` (keep inline error).

### Task 5: Issue page + header + sidebar

**Files:**
- Modify: `packages/client/src/renderer/pages/issue/issue-page.vue`
- Modify: `packages/client/src/renderer/pages/issue/components/issue-header.vue`
- Modify: `packages/client/src/renderer/pages/issue/components/issue-sidebar.vue`

- [ ] `issue-page.vue`: mirror Task 2's page changes with `issue.toasts.*` keys.
- [ ] `issue-header.vue`: `runAction(action, successMessage)` with catch → `issue.toasts.actionFailed`; subscribe/lock/pin callers pass state-dependent messages; `saveTitle` success → `titleUpdated`; `confirmDelete` gains try/catch: success → `deleted`, error → `deleteFailed`.
- [ ] `issue-sidebar.vue`: `applyIssueUpdate(changes, successMessage, pendingIds?, pending?)` — success toast + catch → `updateFailed`; callers pass `assigneesUpdated` / `labelsUpdated` / `milestoneUpdated` / `closedCompleted` / `closedNotPlanned` / `reopened`.

### Task 6: Repository star error

**Files:**
- Modify: `packages/client/src/renderer/pages/repository/repository-page.vue`

- [ ] In `toggleStarred`'s catch, before `void loadRepositoryViewerState()`, add `toast.error(t('repository.star.error'))` (the `toast` instance already exists in this file).

### Task 7: Validate & commit

- [ ] Run `pnpm typecheck` — expect pass.
- [ ] Run `pnpm --filter @oh-my-github/client build` — expect pass.
- [ ] Verify branch with `git branch --show-current`; `git add` ONLY the 10 renderer files + this plan; commit `feat(client): add toast feedback for mutation actions`.

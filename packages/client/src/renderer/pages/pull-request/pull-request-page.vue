<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
import type { PullRequestDetail } from './components/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@oh-my-github/ui'
import { AlertCircle, GitPullRequest, Pencil } from 'lucide-vue-next'
import {
  ConversationBodyCard,
  ConversationCommentCard,
  ConversationCommentComposer,
  ConversationEventRow,
  ConversationMarkdownEditor,
  ConversationTimeline,
  GitHubActorLink,
} from '@/components'
import {
  createPullRequestComment,
  updatePullRequest,
  updatePullRequestComment,
  usePullRequestDetailQuery,
} from '@/composables/github/use-pull-requests'
import { setReaction } from '@/composables/github/use-reactions'
import { useToast } from '@/composables/use-toast'
import { isReactionContent } from '@/components/conversation/reactions'
import PullRequestHeader from './components/pull-request-header.vue'
import PullRequestSidebar from './components/pull-request-sidebar.vue'
import PullRequestCommitGroup from './components/pull-request-commit-group.vue'
import PullRequestChecksCard from './components/pull-request-checks-card.vue'
import PullRequestReviewCard from './components/pull-request-review-card.vue'
import PullRequestCommitsTab from './components/pull-request-commits-tab.vue'
import PullRequestReviewTab from './components/pull-request-review-tab.vue'
import { usePullRequestTimelineItems } from './composables/use-pull-request-timeline-items'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const { t } = useI18n()
const toast = useToast()

const owner = computed(() => props.tab.owner ?? '')
const repo = computed(() => props.tab.repo ?? '')
const number = computed(() => props.tab.number ?? 0)
const repository = computed(() =>
  owner.value && repo.value
    ? `${owner.value}/${repo.value}`
    : props.tab.title
)
const hasIdentity = computed(() =>
  Boolean(owner.value && repo.value && number.value > 0)
)

const pullRequestQuery = usePullRequestDetailQuery(owner, repo, number, hasIdentity)
const pullRequest = computed<PullRequestDetail | null>(() =>
  (pullRequestQuery.data.value ?? null) as PullRequestDetail | null
)
const timelineItems = usePullRequestTimelineItems(pullRequest)
const activeTab = ref<'conversations' | 'commits' | 'review'>('conversations')
const commentBody = ref('')
const commentError = ref<string | null>(null)
const isSubmittingComment = ref(false)
const isEditingBody = ref(false)
const bodyDraft = ref('')
const bodyError = ref<string | null>(null)
const isSavingBody = ref(false)
const editingCommentId = ref<string | null>(null)
const commentDraft = ref('')
const commentEditError = ref<string | null>(null)
const savingCommentId = ref<string | null>(null)
const canReact = computed(() => Boolean(pullRequest.value && !pullRequest.value.locked))
const isLoading = computed(() => hasIdentity.value && pullRequestQuery.isLoading.value && !pullRequest.value)
const hasError = computed(() => Boolean(pullRequestQuery.error.value))
const showUnavailable = computed(() =>
  hasIdentity.value
  && !isLoading.value
  && !hasError.value
  && !pullRequest.value
)

function retryPullRequest(): void {
  void pullRequestQuery.refetch()
}

async function submitPullRequestComment(): Promise<void> {
  const body = commentBody.value.trim()
  if (!body || isSubmittingComment.value) return

  isSubmittingComment.value = true
  commentError.value = null

  try {
    await createPullRequestComment(owner.value, repo.value, number.value, body)
    commentBody.value = ''
    toast.success(t('pullRequest.toasts.commentPosted'))
    await pullRequestQuery.refetch()
  } catch {
    commentError.value = t('pullRequest.comment.error')
  } finally {
    isSubmittingComment.value = false
  }
}

function startBodyEdit(): void {
  if (!pullRequest.value?.viewerCanUpdate) return

  bodyDraft.value = pullRequest.value.body ?? ''
  bodyError.value = null
  isEditingBody.value = true
}

function cancelBodyEdit(): void {
  isEditingBody.value = false
  bodyDraft.value = ''
  bodyError.value = null
}

async function savePullRequestBody(): Promise<void> {
  if (!pullRequest.value || isSavingBody.value) return

  isSavingBody.value = true
  bodyError.value = null

  try {
    await updatePullRequest(owner.value, repo.value, number.value, {
      body: bodyDraft.value,
    })
    isEditingBody.value = false
    bodyDraft.value = ''
    toast.success(t('pullRequest.toasts.bodyUpdated'))
    await pullRequestQuery.refetch()
  } catch {
    bodyError.value = t('pullRequest.edit.bodyError')
  } finally {
    isSavingBody.value = false
  }
}

function startCommentEdit(commentId: string, body: string): void {
  editingCommentId.value = commentId
  commentDraft.value = body
  commentEditError.value = null
}

function cancelCommentEdit(): void {
  editingCommentId.value = null
  commentDraft.value = ''
  commentEditError.value = null
}

async function toggleReaction(subjectId: string | undefined, content: string, reacted: boolean): Promise<void> {
  if (!subjectId || !isReactionContent(content)) return

  try {
    await setReaction(subjectId, content, reacted)
  } catch {
    // The refetch below restores the server state, reverting the optimistic toggle.
    toast.error(t('pullRequest.toasts.reactionFailed'))
  }

  await pullRequestQuery.refetch()
}

async function savePullRequestCommentEdit(): Promise<void> {
  if (!editingCommentId.value || savingCommentId.value) return

  const commentId = editingCommentId.value
  savingCommentId.value = commentId
  commentEditError.value = null

  try {
    await updatePullRequestComment(owner.value, repo.value, commentId, commentDraft.value)
    cancelCommentEdit()
    toast.success(t('pullRequest.toasts.commentUpdated'))
    await pullRequestQuery.refetch()
  } catch {
    commentEditError.value = t('pullRequest.edit.commentError')
  } finally {
    savingCommentId.value = null
  }
}
</script>

<template>
  <section class="h-full min-h-[34rem] overflow-auto bg-background">
    <div class="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:px-6">
      <Empty
        v-if="!hasIdentity"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <GitPullRequest class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('pullRequest.empty.missingIdentity.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('pullRequest.empty.missingIdentity.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else-if="isLoading"
        class="grid gap-4"
      >
        <div class="grid gap-3 border-b border-border pb-4">
          <div class="flex items-center gap-2">
            <Skeleton class="h-6 w-20 rounded-full" />
            <Skeleton class="h-4 w-40 rounded-md" />
          </div>
          <Skeleton class="h-8 w-4/5 max-w-3xl rounded-md" />
          <Skeleton class="h-4 w-80 max-w-full rounded-md" />
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <main class="grid min-w-0 gap-4">
            <Skeleton class="h-52 rounded-lg" />
            <Skeleton class="h-72 rounded-lg" />
          </main>
          <aside class="grid content-start gap-3">
            <Skeleton
              v-for="index in 7"
              :key="index"
              class="h-24 rounded-lg"
            />
          </aside>
        </div>
      </div>

      <Empty
        v-else-if="hasError"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <AlertCircle class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('pullRequest.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('pullRequest.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="retryPullRequest"
          >
            {{ t('pullRequest.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showUnavailable"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <GitPullRequest class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('pullRequest.empty.unavailable.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('pullRequest.empty.unavailable.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <template v-else-if="pullRequest">
        <PullRequestHeader
          :active-tab="activeTab"
          :pull-request="pullRequest"
          :repository="repository"
          @refetch="pullRequestQuery.refetch()"
          @select-tab="activeTab = $event as 'conversations' | 'commits' | 'review'"
        />

        <div
          v-if="activeTab === 'conversations'"
          class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <main class="grid min-w-0 content-start gap-4">
            <ConversationBodyCard
              :actor="pullRequest.author"
              :body="pullRequest.body ?? ''"
              :can-react="canReact && Boolean(pullRequest.nodeId)"
              :created-at="pullRequest.createdAt"
              :editing="isEditingBody"
              :empty-label="t('pullRequest.empty.body')"
              :owner="owner"
              :repo="repo"
              :reactions="pullRequest.reactions ?? []"
              :updated-at="pullRequest.updatedAt"
              @reaction-toggle="(content, reacted) => toggleReaction(pullRequest?.nodeId, content, reacted)"
            >
              <template
                v-if="pullRequest.viewerCanUpdate && !isEditingBody"
                #actions
              >
                <Button
                  :aria-label="t('pullRequest.actions.editBody')"
                  class="size-7 text-muted-foreground"
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  @click="startBodyEdit"
                >
                  <Pencil class="size-3.5" />
                </Button>
              </template>

              <template #editor>
                <ConversationMarkdownEditor
                  v-model="bodyDraft"
                  allow-empty
                  :error="bodyError"
                  :is-submitting="isSavingBody"
                  :owner="owner"
                  :repo="repo"
                  @cancel="cancelBodyEdit"
                  @submit="savePullRequestBody"
                />
              </template>
            </ConversationBodyCard>

            <section class="min-w-0">
              <ConversationTimeline
                :empty-label="t('pullRequest.activity.empty')"
                :items="timelineItems"
              >
                <div class="grid min-w-0 gap-4 pb-0 pl-3 pt-1">
                  <template
                    v-for="item in timelineItems"
                    :key="item.id"
                  >
                    <div
                      v-if="item.kind === 'comment'"
                      class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3"
                    >
                      <div class="flex h-10 items-center justify-center">
                        <GitHubActorLink
                          avatar-size="lg"
                          :avatar-url="item.actor.avatarUrl"
                          :is-bot="item.actor.isBot"
                          :login="item.actor.login"
                          :show-username="false"
                        />
                      </div>
                      <ConversationCommentCard
                        :actor="item.actor"
                        :badges="item.badges"
                        :body="item.body"
                        :can-react="canReact && Boolean(item.nodeId)"
                        :comment-id="item.commentId"
                        :created-at="item.createdAt"
                        :editing="editingCommentId === item.commentId"
                        :owner="owner"
                        :repo="repo"
                        :reactions="item.reactions"
                        :show-avatar="false"
                        :updated-at="item.updatedAt"
                        @reaction-toggle="(content, reacted) => toggleReaction(item.nodeId, content, reacted)"
                      >
                        <template
                          v-if="item.viewerCanUpdate && editingCommentId !== item.commentId"
                          #actions
                        >
                          <Button
                            :aria-label="t('pullRequest.actions.editComment')"
                            class="size-7 text-muted-foreground"
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                            @click="startCommentEdit(item.commentId, item.body)"
                          >
                            <Pencil class="size-3.5" />
                          </Button>
                        </template>

                        <template #editor>
                          <ConversationMarkdownEditor
                            v-model="commentDraft"
                            :error="commentEditError"
                            :is-submitting="savingCommentId === item.commentId"
                            :owner="owner"
                            :repo="repo"
                            @cancel="cancelCommentEdit"
                            @submit="savePullRequestCommentEdit"
                          />
                        </template>
                      </ConversationCommentCard>
                    </div>
                    <div
                      v-else-if="item.kind === 'review'"
                      class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3"
                    >
                      <div class="flex h-10 items-center justify-center">
                        <GitHubActorLink
                          avatar-size="lg"
                          :avatar-url="item.actor.avatarUrl"
                          :is-bot="item.actor.isBot"
                          :login="item.actor.login"
                          :show-username="false"
                        />
                      </div>
                      <PullRequestReviewCard
                        :actor="item.actor"
                        :body="item.body"
                        :can-react="canReact"
                        :comments="item.comments"
                        :created-at="item.createdAt"
                        :owner="owner"
                        :repo="repo"
                        :review-state="item.reviewState"
                        @reaction-toggle="toggleReaction"
                      />
                    </div>
                    <PullRequestCommitGroup
                      v-else-if="item.kind === 'commit-group'"
                      :actor="item.actor"
                      :commits="item.commits"
                      :created-at="item.createdAt"
                      :owner="owner"
                      :repo="repo"
                    />
                    <ConversationEventRow
                      v-else
                      :event="item.event"
                    />
                  </template>
                </div>
              </ConversationTimeline>

              <PullRequestChecksCard
                v-if="pullRequest.headSha"
                class="mt-5"
                :open="activeTab === 'conversations'"
                :owner="owner"
                :repo="repo"
                :sha="pullRequest.headSha"
              />

              <div class="relative mt-5 min-w-0">
                <div
                  class="absolute bottom-full left-7 h-3 w-px bg-border"
                  aria-hidden="true"
                />
                <ConversationCommentComposer
                  v-model="commentBody"
                  :error="commentError"
                  i18n-scope="pullRequest.comment"
                  :is-submitting="isSubmittingComment"
                  :owner="owner"
                  :repo="repo"
                  @submit="submitPullRequestComment"
                />
              </div>
            </section>
          </main>

          <PullRequestSidebar
            class="min-w-0 xl:sticky xl:top-4 xl:self-start"
            :pull-request="pullRequest"
            :refetch="() => pullRequestQuery.refetch()"
          />
        </div>

        <PullRequestCommitsTab
          v-else-if="activeTab === 'commits'"
          :active="activeTab === 'commits'"
          :number="number"
          :owner="owner"
          :repo="repo"
        />

        <PullRequestReviewTab
          v-else
          :active="activeTab === 'review'"
          :number="number"
          :owner="owner"
          :pull-request="pullRequest"
          :repo="repo"
          @refetch="pullRequestQuery.refetch()"
        />
      </template>
    </div>
  </section>
</template>

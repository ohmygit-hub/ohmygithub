<script setup lang="ts">
import type { WorkspaceTab } from '@/pages/workspace/types'
import type { IssueDetail } from './components/types'
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
import { AlertCircle, CircleDot, Pencil } from 'lucide-vue-next'
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
  createIssueComment,
  updateIssue,
  updateIssueComment,
  useIssueDetailQuery,
} from '@/composables/github/use-issues'
import { setReaction } from '@/composables/github/use-reactions'
import { useToast } from '@/composables/use-toast'
import { isReactionContent } from '@/components/conversation/reactions'
import IssueHeader from './components/issue-header.vue'
import IssueSidebar from './components/issue-sidebar.vue'
import { useIssueTimelineItems } from './composables/use-issue-timeline-items'

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

const issueQuery = useIssueDetailQuery(owner, repo, number, hasIdentity)
const issue = computed<IssueDetail | null>(() => (issueQuery.data.value ?? null) as IssueDetail | null)
const timelineItems = useIssueTimelineItems(issue)
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
const canReact = computed(() => Boolean(issue.value && !issue.value.locked))
const isLoading = computed(() => hasIdentity.value && issueQuery.isLoading.value && !issue.value)
const hasError = computed(() => Boolean(issueQuery.error.value))
const showUnavailable = computed(() =>
  hasIdentity.value
  && !isLoading.value
  && !hasError.value
  && !issue.value
)

function retryIssue(): void {
  void issueQuery.refetch()
}

async function submitIssueComment(): Promise<void> {
  const body = commentBody.value.trim()
  if (!body || isSubmittingComment.value) return

  isSubmittingComment.value = true
  commentError.value = null

  try {
    await createIssueComment(owner.value, repo.value, number.value, body)
    commentBody.value = ''
    toast.success(t('issue.toasts.commentPosted'))
    await issueQuery.refetch()
  } catch {
    commentError.value = t('issue.comment.error')
  } finally {
    isSubmittingComment.value = false
  }
}

function startBodyEdit(): void {
  if (!issue.value?.viewerCanUpdate) return

  bodyDraft.value = issue.value.body ?? ''
  bodyError.value = null
  isEditingBody.value = true
}

function cancelBodyEdit(): void {
  isEditingBody.value = false
  bodyDraft.value = ''
  bodyError.value = null
}

async function saveIssueBody(): Promise<void> {
  if (!issue.value || isSavingBody.value) return

  isSavingBody.value = true
  bodyError.value = null

  try {
    await updateIssue(owner.value, repo.value, number.value, {
      body: bodyDraft.value,
    })
    isEditingBody.value = false
    bodyDraft.value = ''
    toast.success(t('issue.toasts.bodyUpdated'))
    await issueQuery.refetch()
  } catch {
    bodyError.value = t('issue.edit.bodyError')
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
    toast.error(t('issue.toasts.reactionFailed'))
  }

  await issueQuery.refetch()
}

async function saveIssueCommentEdit(): Promise<void> {
  if (!editingCommentId.value || savingCommentId.value) return

  const commentId = editingCommentId.value
  savingCommentId.value = commentId
  commentEditError.value = null

  try {
    await updateIssueComment(owner.value, repo.value, commentId, commentDraft.value)
    cancelCommentEdit()
    toast.success(t('issue.toasts.commentUpdated'))
    await issueQuery.refetch()
  } catch {
    commentEditError.value = t('issue.edit.commentError')
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
            <CircleDot class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('issue.empty.missingIdentity.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('issue.empty.missingIdentity.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div
        v-else-if="isLoading"
        class="grid gap-4"
      >
        <div class="grid gap-3 border-b border-border pb-4">
          <div class="flex items-center gap-2">
            <Skeleton class="h-6 w-16 rounded-full" />
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
              v-for="index in 6"
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
            {{ t('issue.error.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('issue.error.description') }}
          </EmptyDescription>
          <Button
            class="justify-self-center"
            size="sm"
            type="button"
            variant="outline"
            @click="retryIssue"
          >
            {{ t('issue.error.retry') }}
          </Button>
        </EmptyHeader>
      </Empty>

      <Empty
        v-else-if="showUnavailable"
        class="min-h-[24rem] border border-border bg-card"
      >
        <EmptyHeader>
          <EmptyMedia>
            <CircleDot class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('issue.empty.unavailable.title') }}
          </EmptyTitle>
          <EmptyDescription>
            {{ t('issue.empty.unavailable.description') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <template v-else-if="issue">
        <IssueHeader
          :issue="issue"
          :repository="repository"
          @refetch="issueQuery.refetch()"
        />

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <main class="grid min-w-0 content-start gap-4">
            <ConversationBodyCard
              :actor="issue.author"
              :body="issue.body ?? ''"
              :can-react="canReact && Boolean(issue.nodeId)"
              :created-at="issue.createdAt"
              :editing="isEditingBody"
              :empty-label="t('issue.empty.body')"
              :owner="owner"
              :repo="repo"
              :reactions="issue.reactions ?? []"
              :updated-at="issue.updatedAt"
              @reaction-toggle="(content, reacted) => toggleReaction(issue?.nodeId, content, reacted)"
            >
              <template
                v-if="issue.viewerCanUpdate && !isEditingBody"
                #actions
              >
                <Button
                  :aria-label="t('issue.actions.editBody')"
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
                  @submit="saveIssueBody"
                />
              </template>
            </ConversationBodyCard>

            <section class="min-w-0">
              <ConversationTimeline
                :empty-label="t('issue.activity.empty')"
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
                            :aria-label="t('issue.actions.editComment')"
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
                            @submit="saveIssueCommentEdit"
                          />
                        </template>
                      </ConversationCommentCard>
                    </div>
                    <ConversationEventRow
                      v-else
                      :event="item.event"
                    />
                  </template>
                </div>
              </ConversationTimeline>

              <div class="relative mt-5 min-w-0">
                <div
                  class="absolute bottom-full left-7 h-3 w-px bg-border"
                  aria-hidden="true"
                />
                <ConversationCommentComposer
                  v-model="commentBody"
                  :error="commentError"
                  :is-submitting="isSubmittingComment"
                  :owner="owner"
                  :repo="repo"
                  @submit="submitIssueComment"
                />
              </div>
            </section>
          </main>

          <IssueSidebar
            class="min-w-0 xl:sticky xl:top-4 xl:self-start"
            :issue="issue"
            :refetch="() => issueQuery.refetch()"
          />
        </div>
      </template>
    </div>
  </section>
</template>

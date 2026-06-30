<script setup lang="ts">
import type { WorkspaceTab } from '../workspace/types'
import type {
  IssueAssigneesUpdatePayload,
  IssueDetail,
  IssueLabelsUpdatePayload,
  IssueMilestoneUpdatePayload,
  IssueStateUpdatePayload,
  IssueTimelineItem,
  IssueTitleUpdatePayload,
} from './components/types'
import { computed, onMounted, ref } from 'vue'
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
import { AlertCircle, CircleDot } from 'lucide-vue-next'
import {
  ConversationBodyCard,
  ConversationCommentCard,
  ConversationCommentComposer,
  ConversationEventRow,
  ConversationTimeline,
  GitHubActorLink,
} from '../../components'
import {
  createIssueComment,
  deleteIssueComment,
  editIssueComment,
  updateIssue,
  useIssueDetailQuery,
  useRepositoryAssignableUsersQuery,
  useRepositoryIssueLabelsQuery,
  useRepositoryIssueMilestonesQuery,
} from '../../composables/github/use-issues'
import IssueHeader from './components/issue-header.vue'
import IssueSidebar from './components/issue-sidebar.vue'
import { useIssueTimelineItems } from './composables/use-issue-timeline-items'

const props = defineProps<{
  tab: WorkspaceTab
}>()

const { t } = useI18n()

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
const labelOptionsQuery = useRepositoryIssueLabelsQuery(owner, repo, hasIdentity)
const assigneeOptionsQuery = useRepositoryAssignableUsersQuery(owner, repo, hasIdentity)
const milestoneOptionsQuery = useRepositoryIssueMilestonesQuery(owner, repo, hasIdentity)
const issue = computed<IssueDetail | null>(() => (issueQuery.data.value ?? null) as IssueDetail | null)
const timelineItems = useIssueTimelineItems(issue)
const labelOptions = computed(() => labelOptionsQuery.data.value ?? null)
const assigneeOptions = computed(() => assigneeOptionsQuery.data.value ?? null)
const milestoneOptions = computed(() => milestoneOptionsQuery.data.value ?? null)
const commentBody = ref('')
const commentError = ref<string | null>(null)
const mutationError = ref<string | null>(null)
const viewerLogin = ref<string | null>(null)
const isSubmittingComment = ref(false)
const isUpdatingTitle = ref(false)
const isUpdatingState = ref(false)
const isUpdatingLabels = ref(false)
const isUpdatingAssignees = ref(false)
const isUpdatingMilestone = ref(false)
const editingCommentId = ref<string | null>(null)
const savingCommentDatabaseId = ref<number | null>(null)
const deletingCommentDatabaseId = ref<number | null>(null)
const isLoading = computed(() => hasIdentity.value && issueQuery.isLoading.value && !issue.value)
const hasError = computed(() => Boolean(issueQuery.error.value))
const showUnavailable = computed(() =>
  hasIdentity.value
  && !isLoading.value
  && !hasError.value
  && !issue.value
)
const commentActionLabels = computed(() => ({
  actions: t('issue.comment.actions'),
  cancel: t('issue.comment.cancel'),
  delete: t('issue.comment.delete'),
  edit: t('issue.comment.edit'),
  emptyPreview: t('issue.comment.emptyPreview'),
  input: t('issue.comment.inputLabel'),
  placeholder: t('issue.comment.placeholder'),
  preview: t('issue.comment.preview'),
  save: t('issue.comment.save'),
  write: t('issue.comment.write'),
}))

type IssueCommentTimelineItem = Extract<IssueTimelineItem, { kind: 'comment' }>

onMounted(() => {
  void loadViewer()
})

function retryIssue(): void {
  void issueQuery.refetch()
}

async function loadViewer(): Promise<void> {
  try {
    const state = await window.ohMyGithub.auth.get()
    viewerLogin.value = state.auth?.viewer.login ?? null
  } catch {
    viewerLogin.value = null
  }
}

async function refetchIssue(): Promise<void> {
  await issueQuery.refetch()
}

async function updateCurrentIssue(
  patch: Omit<UpdateIssueOptions, 'owner' | 'repo' | 'number'>,
): Promise<void> {
  mutationError.value = null

  await updateIssue({
    owner: owner.value,
    repo: repo.value,
    number: number.value,
    ...patch,
  })
  await refetchIssue()
}

async function updateIssueTitle(payload: IssueTitleUpdatePayload): Promise<void> {
  if (isUpdatingTitle.value) return

  isUpdatingTitle.value = true

  try {
    await updateCurrentIssue({ title: payload.title })
  } catch {
    mutationError.value = t('issue.error.update')
  } finally {
    isUpdatingTitle.value = false
  }
}

async function updateIssueState(payload: IssueStateUpdatePayload): Promise<void> {
  if (isUpdatingState.value) return

  isUpdatingState.value = true

  try {
    await updateCurrentIssue({ state: payload.state })
  } catch {
    mutationError.value = t('issue.error.update')
  } finally {
    isUpdatingState.value = false
  }
}

async function updateIssueLabels(payload: IssueLabelsUpdatePayload): Promise<void> {
  if (isUpdatingLabels.value) return

  isUpdatingLabels.value = true

  try {
    await updateCurrentIssue({ labels: payload.labelNames })
  } catch {
    mutationError.value = t('issue.error.update')
  } finally {
    isUpdatingLabels.value = false
  }
}

async function updateIssueAssignees(payload: IssueAssigneesUpdatePayload): Promise<void> {
  if (isUpdatingAssignees.value) return

  isUpdatingAssignees.value = true

  try {
    await updateCurrentIssue({ assignees: payload.assigneeLogins })
  } catch {
    mutationError.value = t('issue.error.update')
  } finally {
    isUpdatingAssignees.value = false
  }
}

async function updateIssueMilestone(payload: IssueMilestoneUpdatePayload): Promise<void> {
  if (isUpdatingMilestone.value) return

  isUpdatingMilestone.value = true

  try {
    await updateCurrentIssue({ milestone: payload.milestoneNumber })
  } catch {
    mutationError.value = t('issue.error.update')
  } finally {
    isUpdatingMilestone.value = false
  }
}

async function submitIssueComment(): Promise<void> {
  const body = commentBody.value.trim()
  if (!body || isSubmittingComment.value) return

  isSubmittingComment.value = true
  commentError.value = null
  mutationError.value = null

  try {
    await createIssueComment(owner.value, repo.value, number.value, body)
    commentBody.value = ''
    await issueQuery.refetch()
  } catch {
    commentError.value = t('issue.comment.error')
  } finally {
    isSubmittingComment.value = false
  }
}

function startCommentEdit(item: IssueCommentTimelineItem): void {
  editingCommentId.value = item.commentId
}

function cancelCommentEdit(item: IssueCommentTimelineItem): void {
  if (editingCommentId.value === item.commentId) {
    editingCommentId.value = null
  }
}

async function saveIssueComment(item: IssueCommentTimelineItem, body: string): Promise<void> {
  const nextBody = body.trim()
  if (!item.databaseId || !nextBody || savingCommentDatabaseId.value !== null) return

  savingCommentDatabaseId.value = item.databaseId
  mutationError.value = null

  try {
    await editIssueComment(owner.value, repo.value, item.databaseId, nextBody)
    editingCommentId.value = null
    await refetchIssue()
  } catch {
    mutationError.value = t('issue.comment.editError')
  } finally {
    savingCommentDatabaseId.value = null
  }
}

async function deleteIssueTimelineComment(item: IssueCommentTimelineItem): Promise<void> {
  if (!item.databaseId || deletingCommentDatabaseId.value !== null) return
  if (!window.confirm(t('issue.comment.confirmDelete'))) return

  deletingCommentDatabaseId.value = item.databaseId
  mutationError.value = null

  try {
    await deleteIssueComment(owner.value, repo.value, item.databaseId)
    cancelCommentEdit(item)
    await refetchIssue()
  } catch {
    mutationError.value = t('issue.comment.deleteError')
  } finally {
    deletingCommentDatabaseId.value = null
  }
}

function canManageComment(item: IssueCommentTimelineItem): boolean {
  return Boolean(
    item.databaseId
    && viewerLogin.value
    && item.actor.login.toLocaleLowerCase() === viewerLogin.value.toLocaleLowerCase(),
  )
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
          :is-updating-state="isUpdatingState"
          :is-updating-title="isUpdatingTitle"
          :repository="repository"
          @update-state="updateIssueState"
          @update-title="updateIssueTitle"
        />

        <p
          v-if="mutationError"
          class="-mt-2 text-body text-destructive"
          role="alert"
        >
          {{ mutationError }}
        </p>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <main class="grid min-w-0 content-start gap-4">
            <ConversationBodyCard
              :actor="issue.author"
              :body="issue.body ?? ''"
              :created-at="issue.createdAt"
              :empty-label="t('issue.empty.body')"
              :owner="owner"
              :repo="repo"
              :reactions="issue.reactions ?? []"
              :updated-at="issue.updatedAt"
            />

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
                        :action-labels="commentActionLabels"
                        :actor="item.actor"
                        :badges="item.badges"
                        :body="item.body"
                        :comment-id="item.commentId"
                        :created-at="item.createdAt"
                        :deletable="canManageComment(item)"
                        :editable="canManageComment(item)"
                        :is-deleting="deletingCommentDatabaseId === item.databaseId"
                        :is-editing="editingCommentId === item.commentId"
                        :is-saving="savingCommentDatabaseId === item.databaseId"
                        :owner="owner"
                        :repo="repo"
                        :reactions="item.reactions"
                        :show-avatar="false"
                        :updated-at="item.updatedAt"
                        @cancel="cancelCommentEdit(item)"
                        @delete="deleteIssueTimelineComment(item)"
                        @edit="startCommentEdit(item)"
                        @save="saveIssueComment(item, $event.body)"
                      />
                    </div>
                    <ConversationEventRow
                      v-else
                      :event="item.event"
                    />
                  </template>
                </div>
              </ConversationTimeline>

              <div class="relative mt-5 min-w-0 pl-2">
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
            :assignee-options="assigneeOptions"
            :issue="issue"
            :is-updating-assignees="isUpdatingAssignees || assigneeOptionsQuery.isLoading.value"
            :is-updating-labels="isUpdatingLabels || labelOptionsQuery.isLoading.value"
            :is-updating-milestone="isUpdatingMilestone || milestoneOptionsQuery.isLoading.value"
            :label-options="labelOptions"
            :milestone-options="milestoneOptions"
            @update-assignees="updateIssueAssignees"
            @update-labels="updateIssueLabels"
            @update-milestone="updateIssueMilestone"
          />
        </div>
      </template>
    </div>
  </section>
</template>

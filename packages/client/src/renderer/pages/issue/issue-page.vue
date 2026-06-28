<script setup lang="ts">
import type { WorkspaceTab } from '../workspace/types'
import type { IssueDetail } from './components/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  ConversationEventRow,
  ConversationTimeline,
} from '../../components'
import { createIssueComment, useIssueDetailQuery } from '../../composables/github/use-issues'
import IssueCommentComposer from './components/issue-comment-composer.vue'
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
const issue = computed<IssueDetail | null>(() => (issueQuery.data.value ?? null) as IssueDetail | null)
const timelineItems = useIssueTimelineItems(issue)
const commentBody = ref('')
const commentError = ref<string | null>(null)
const isSubmittingComment = ref(false)
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

function actorFallback(actor: { login: string }): string {
  return actor.login.slice(0, 1).toUpperCase()
}

async function submitIssueComment(): Promise<void> {
  const body = commentBody.value.trim()
  if (!body || isSubmittingComment.value) return

  isSubmittingComment.value = true
  commentError.value = null

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
        />

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <main class="grid min-w-0 content-start gap-4">
            <ConversationBodyCard
              :actor="issue.author"
              :body="issue.body ?? ''"
              :created-at="issue.createdAt"
              :empty-label="t('issue.empty.body')"
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
                      <div class="flex justify-center pt-1">
                        <Avatar class="size-8 border border-border bg-background">
                          <AvatarImage
                            v-if="item.actor.avatarUrl"
                            :alt="item.actor.login"
                            :src="item.actor.avatarUrl"
                          />
                          <AvatarFallback class="text-caption">
                            {{ actorFallback(item.actor) }}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <ConversationCommentCard
                        :actor="item.actor"
                        :badges="item.badges"
                        :body="item.body"
                        :comment-id="item.commentId"
                        :created-at="item.createdAt"
                        :reactions="item.reactions"
                        :show-avatar="false"
                        :updated-at="item.updatedAt"
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
                <IssueCommentComposer
                  v-model="commentBody"
                  :error="commentError"
                  :is-submitting="isSubmittingComment"
                  @submit="submitIssueComment"
                />
              </div>
            </section>
          </main>

          <IssueSidebar
            class="min-w-0 xl:sticky xl:top-4 xl:self-start"
            :issue="issue"
          />
        </div>
      </template>
    </div>
  </section>
</template>

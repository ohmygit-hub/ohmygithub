<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '@oh-my-github/ui'
import {
  BellOff,
  Check,
  CircleDot,
  GitCommit,
  GitPullRequest,
  MessagesSquare,
  PlayCircle,
  Tag,
} from 'lucide-vue-next'
import { formatConversationDate } from '../../../components/conversation/format'

const props = defineProps<{
  notification: GitHubNotification
}>()

const emit = defineEmits<{
  open: [notification: GitHubNotification]
  'mark-read': [notification: GitHubNotification]
  done: [notification: GitHubNotification]
  unsubscribe: [notification: GitHubNotification]
}>()

const { t } = useI18n()

const iconComponent = computed(() => {
  switch (props.notification.subjectType) {
    case 'PullRequest':
      return GitPullRequest
    case 'Issue':
      return CircleDot
    case 'Commit':
      return GitCommit
    case 'Release':
      return Tag
    case 'Discussion':
      return MessagesSquare
    case 'CheckSuite':
    case 'WorkflowRun':
      return PlayCircle
    default:
      return CircleDot
  }
})

const reasonLabel = computed(() => {
  const key = `workspace.inbox.reasons.${props.notification.reason}`
  const label = t(key)
  return label === key ? props.notification.reason : label
})

const timestamp = computed(() => formatConversationDate(props.notification.updatedAt))
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50"
    role="button"
    tabindex="0"
    @click="emit('open', notification)"
    @keydown.enter.prevent="emit('open', notification)"
  >
    <span
      class="size-2 shrink-0 rounded-full"
      :class="notification.unread ? 'bg-info' : 'bg-transparent'"
    />

    <component
      :is="iconComponent"
      class="size-4 shrink-0 text-muted-foreground"
    />

    <div class="grid min-w-0 flex-1 gap-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <span class="truncate text-caption text-muted-foreground">{{ notification.repositoryFullName }}</span>
      </div>
      <span
        class="truncate text-label text-foreground"
        :class="notification.unread ? 'font-semibold' : 'font-normal'"
      >
        {{ notification.subjectTitle }}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <Badge variant="secondary">{{ reasonLabel }}</Badge>
      <span
        v-if="timestamp"
        class="text-caption text-muted-foreground"
      >{{ timestamp }}</span>
    </div>

    <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            v-if="notification.unread"
            variant="ghost"
            size="icon"
            @click.stop="emit('mark-read', notification)"
          >
            <Check class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ t('workspace.inbox.actions.markRead') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            @click.stop="emit('done', notification)"
          >
            <CircleDot class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ t('workspace.inbox.actions.done') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            @click.stop="emit('unsubscribe', notification)"
          >
            <BellOff class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ t('workspace.inbox.actions.unsubscribe') }}</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

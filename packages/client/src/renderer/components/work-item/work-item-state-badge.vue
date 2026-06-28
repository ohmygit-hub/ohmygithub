<script setup lang="ts">
import type { Component } from 'vue'
import type { BadgeVariants } from '@oh-my-github/ui'
import type { WorkItemState } from './types'
import { computed } from 'vue'
import { Badge } from '@oh-my-github/ui'
import {
  Ban,
  CheckCircle2,
  CircleDot,
  GitMerge,
  GitPullRequestDraft,
  XCircle,
} from 'lucide-vue-next'

const props = defineProps<{
  state: WorkItemState
  label: string
}>()

interface StateBadgeConfig {
  icon: Component
  variant: BadgeVariants['variant']
}

const stateConfig = computed<StateBadgeConfig>(() => {
  switch (props.state) {
    case 'open':
      return { icon: CircleDot, variant: 'success' }
    case 'completed':
      return { icon: CheckCircle2, variant: 'success' }
    case 'merged':
      return { icon: GitMerge, variant: 'info' }
    case 'draft':
      return { icon: GitPullRequestDraft, variant: 'secondary' }
    case 'not_planned':
      return { icon: Ban, variant: 'warning' }
    case 'closed':
      return { icon: XCircle, variant: 'destructive' }
    default:
      return { icon: CircleDot, variant: 'outline' }
  }
})
</script>

<template>
  <Badge
    class="max-w-full"
    :variant="stateConfig.variant"
  >
    <component
      :is="stateConfig.icon"
      class="size-3 shrink-0"
    />
    <span class="truncate">{{ label }}</span>
  </Badge>
</template>

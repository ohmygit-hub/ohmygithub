<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import WorkItemStateIcon from '../work-item/work-item-state-icon.vue'
import { createReferenceWorkspaceUrl } from './github-reference'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  owner: string
  repo: string
  number: number
  kindHint?: GitHubRepositoryReferenceKind
  initialTitle?: string | null
  initialState?: GitHubRepositoryReferenceState | null
  initialKind?: GitHubRepositoryReferenceKind | null
  fallbackHref?: string | null
  currentOwner?: string | null
  currentRepo?: string | null
  interactive?: boolean
  variant?: 'inline' | 'hover' | 'pill'
}>(), {
  initialTitle: null,
  initialState: null,
  initialKind: null,
  fallbackHref: null,
  currentOwner: null,
  currentRepo: null,
  interactive: true,
  variant: 'inline',
})

const router = useRouter()
const hasIdentity = computed(() =>
  props.owner.trim().length > 0
    && props.repo.trim().length > 0
    && Number.isInteger(props.number)
    && props.number > 0
)
const referenceQuery = useQuery<GitHubRepositoryReferenceResolution>({
  key: () => [
    'github',
    'repository-reference',
    props.owner,
    props.repo,
    props.number,
    props.kindHint ?? '',
  ],
  enabled: () => hasIdentity.value && Boolean(window.ohMyGithub?.search),
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 30,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  query: async () => {
    if (!window.ohMyGithub?.search) {
      throw new Error('GitHub search bridge is unavailable')
    }

    return window.ohMyGithub.search.resolveRepositoryReference({
      owner: props.owner,
      repo: props.repo,
      number: props.number,
      kindHint: props.kindHint,
    })
  },
})

const resolved = computed(() => {
  const result = referenceQuery.data.value

  return result?.status === 'found' ? result : null
})
const isSameRepository = computed(() =>
  props.currentOwner?.toLowerCase() === props.owner.toLowerCase()
    && props.currentRepo?.toLowerCase() === props.repo.toLowerCase()
)
const kind = computed(() => resolved.value?.kind ?? props.initialKind ?? props.kindHint ?? null)
const state = computed(() => resolved.value?.state ?? props.initialState ?? null)
const title = computed(() => resolved.value?.title ?? props.initialTitle ?? '')
const prefix = computed(() =>
  isSameRepository.value
    ? `#${props.number}`
    : `${props.owner}/${props.repo}#${props.number}`
)
const label = computed(() => {
  const normalizedTitle = title.value.trim()

  return normalizedTitle ? `${prefix.value} ${normalizedTitle}` : prefix.value
})
const workspaceUrl = computed(() =>
  resolved.value?.workspaceUrl ?? fallbackWorkspaceUrl.value
)
const fallbackWorkspaceUrl = computed(() => {
  const fallbackKind = props.initialKind ?? props.kindHint
  if (!fallbackKind || !hasIdentity.value) return null

  return createReferenceWorkspaceUrl(props.owner, props.repo, fallbackKind, props.number)
})
const canOpenInternally = computed(() => props.interactive && Boolean(workspaceUrl.value))
const canOpenFallback = computed(() => props.interactive && !canOpenInternally.value && Boolean(props.fallbackHref))
const tone = computed(() => {
  if (kind.value === 'pull-request') {
    if (state.value === 'closed') return 'danger'

    return 'pull-request'
  }

  if (kind.value === 'issue') {
    if (state.value === 'completed') return 'completed'
    if (state.value === 'not_planned') return 'muted'

    return 'issue'
  }

  return 'default'
})
const linkClass = computed(() => {
  if (props.variant === 'pill') {
    return [
      'github-reference-link github-reference-link--pill',
      props.interactive ? 'github-reference-link--interactive' : '',
    ]
  }

  if (props.variant === 'hover') {
    return [
      'github-reference-link github-reference-link--hover',
      props.interactive ? 'github-reference-link--interactive' : '',
    ]
  }

  return [
    'github-reference-link github-reference-link--inline',
    props.interactive ? 'github-reference-link--interactive' : '',
  ]
})
const labelClass = computed(() => {
  if (props.variant === 'pill') return 'github-reference-link__label'

  return 'github-reference-link__label'
})

function openReference(): void {
  if (!canOpenInternally.value || !workspaceUrl.value) return

  void router.push(workspaceUrl.value)
}
</script>

<template>
  <button
    v-if="canOpenInternally"
    v-bind="$attrs"
    :class="linkClass"
    :data-tone="tone"
    :data-variant="variant"
    :title="label"
    type="button"
    @click.stop="openReference"
  >
    <WorkItemStateIcon
      v-if="kind && state"
      :kind="kind"
      size="sm"
      :state="state"
      tone="current"
    />
    <span :class="labelClass">{{ label }}</span>
  </button>

  <a
    v-else-if="canOpenFallback"
    v-bind="$attrs"
    :class="linkClass"
    :data-tone="tone"
    :data-variant="variant"
    :href="fallbackHref ?? undefined"
    rel="noreferrer"
    target="_blank"
    :title="label"
  >
    <WorkItemStateIcon
      v-if="kind && state"
      :kind="kind"
      size="sm"
      :state="state"
      tone="current"
    />
    <span :class="labelClass">{{ label }}</span>
  </a>

  <span
    v-else
    v-bind="$attrs"
    :class="linkClass"
    :data-tone="tone"
    :data-variant="variant"
    :title="label"
  >
    <WorkItemStateIcon
      v-if="kind && state"
      :kind="kind"
      size="sm"
      :state="state"
      tone="current"
    />
    <span :class="labelClass">{{ label }}</span>
  </span>
</template>

<style scoped>
.github-reference-link {
  align-items: center;
  color: var(--primary);
  gap: 0.25rem;
  max-width: 100%;
  min-width: 0;
  outline: none;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    opacity 120ms ease;
}

.github-reference-link[data-tone="issue"] {
  color: var(--success) !important;
}

.github-reference-link[data-tone="pull-request"],
.github-reference-link[data-tone="completed"] {
  color: var(--accent-purple) !important;
}

.github-reference-link[data-tone="danger"] {
  color: var(--destructive) !important;
}

.github-reference-link[data-tone="muted"] {
  color: var(--muted-foreground) !important;
}

.github-reference-link--inline {
  border-bottom: 1px solid currentColor;
  border-radius: 0;
  display: inline-flex;
  overflow: hidden;
  text-decoration: none !important;
  vertical-align: baseline;
  white-space: nowrap;
}

.github-reference-link--hover {
  border-bottom: 1px solid transparent;
  border-radius: 0;
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
  text-align: left;
  white-space: nowrap;
  width: 100%;
}

.github-reference-link--pill {
  background-color: color-mix(in oklch, currentColor 12%, transparent);
  border: 1px solid color-mix(in oklch, currentColor 26%, transparent);
  border-radius: 9999px;
  display: inline-flex;
  overflow: hidden;
  padding: 0.125rem 0.5rem;
  text-decoration: none !important;
  vertical-align: middle;
  white-space: nowrap;
}

.github-reference-link--interactive {
  cursor: pointer;
}

.github-reference-link--interactive:hover {
  opacity: 0.9;
}

.github-reference-link--hover.github-reference-link--interactive:hover,
.github-reference-link--hover.github-reference-link--interactive:focus-visible {
  border-bottom-color: currentColor;
}

.github-reference-link--pill.github-reference-link--interactive:hover,
.github-reference-link--pill.github-reference-link--interactive:focus-visible {
  background-color: color-mix(in oklch, currentColor 18%, transparent);
}

.github-reference-link:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--ring) 30%, transparent);
}

.github-reference-link__label {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

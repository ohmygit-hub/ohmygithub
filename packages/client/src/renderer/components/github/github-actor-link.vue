<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@oh-my-github/ui'
import { createTeamWorkspaceUrl } from '@/pages/workspace/workspace-url'
import { createAccountWorkspaceUrl, createAppWorkspaceUrl, createGitHubAvatarUrl } from './github-reference'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  login: string
  avatarUrl?: string | null
  showAvatar?: boolean
  showUsername?: boolean
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  variant?: 'plain' | 'pill'
  isBot?: boolean
  showBotBadge?: boolean
  /** When set, `login` is a team slug in this organization and the link opens the team page. */
  teamOrg?: string | null
}>(), {
  showAvatar: true,
  showUsername: true,
  avatarSize: 'sm',
  interactive: true,
  variant: 'plain',
  isBot: false,
  showBotBadge: true,
  teamOrg: null,
})

const router = useRouter()
const { t } = useI18n()

const normalizedLogin = computed(() => props.login.trim())
const fallback = computed(() => normalizedLogin.value.slice(0, 2).toUpperCase())
const avatarSrc = computed(() => props.avatarUrl || createGitHubAvatarUrl(normalizedLogin.value))
const avatarClass = computed(() => {
  const sizeClass = props.avatarSize === 'xs'
    ? 'size-4'
    : props.avatarSize === 'md'
      ? 'size-7'
      : props.avatarSize === 'lg'
        ? 'size-9'
        : 'size-5'

  return props.isBot ? `${sizeClass} rounded-sm bg-white` : sizeClass
})
const showsBotBadge = computed(() => props.isBot && props.showBotBadge && props.showUsername)
const fallbackClass = computed(() => {
  if (props.avatarSize === 'xs') return 'text-[9px]'
  if (props.avatarSize === 'lg') return 'text-caption'

  return 'text-[10px]'
})
const linkClass = computed(() => [
  'github-actor-link group inline-flex min-w-0 items-center gap-1.5 align-middle text-foreground outline-hidden',
  props.variant === 'pill'
    ? 'github-actor-link--pill'
    : 'rounded-sm',
  props.interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/30' : '',
])

function openProfile(): void {
  if (!props.interactive || !normalizedLogin.value) return

  if (props.teamOrg) {
    void router.push(createTeamWorkspaceUrl(props.teamOrg, normalizedLogin.value))
    return
  }

  void router.push(
    props.isBot
      ? createAppWorkspaceUrl(normalizedLogin.value)
      : createAccountWorkspaceUrl(normalizedLogin.value),
  )
}
</script>

<template>
  <button
    v-if="interactive"
    v-bind="$attrs"
    :class="linkClass"
    :data-variant="variant"
    type="button"
    @click.stop="openProfile"
  >
    <Avatar
      v-if="showAvatar"
      class="shrink-0"
      :class="avatarClass"
    >
      <AvatarImage
        :alt="normalizedLogin"
        :src="avatarSrc"
      />
      <AvatarFallback :class="fallbackClass">
        {{ fallback }}
      </AvatarFallback>
    </Avatar>
    <span
      v-if="showUsername"
      class="min-w-0 truncate font-medium"
      :class="variant === 'plain' ? 'underline-offset-4 group-hover:underline group-focus-visible:underline' : ''"
    >
      {{ normalizedLogin }}
    </span>
    <span
      v-if="showsBotBadge"
      class="github-actor-link__bot-badge"
    >
      {{ t('conversation.actor.bot') }}
    </span>
  </button>

  <span
    v-else
    v-bind="$attrs"
    :class="linkClass"
    :data-variant="variant"
  >
    <Avatar
      v-if="showAvatar"
      class="shrink-0"
      :class="avatarClass"
    >
      <AvatarImage
        :alt="normalizedLogin"
        :src="avatarSrc"
      />
      <AvatarFallback :class="fallbackClass">
        {{ fallback }}
      </AvatarFallback>
    </Avatar>
    <span
      v-if="showUsername"
      class="min-w-0 truncate font-medium"
    >
      {{ normalizedLogin }}
    </span>
    <span
      v-if="showsBotBadge"
      class="github-actor-link__bot-badge"
    >
      {{ t('conversation.actor.bot') }}
    </span>
  </span>
</template>

<style scoped>
.github-actor-link__bot-badge {
  border: 1px solid var(--border);
  border-radius: 9999px;
  color: var(--muted-foreground);
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1;
  padding: 0.125rem 0.375rem;
}

.github-actor-link--pill {
  background-color: var(--ui-hover);
  border: 1px solid var(--border);
  border-radius: 9999px;
  color: var(--foreground);
  padding: 0.125rem 0.5rem;
  transition:
    background-color 120ms ease,
    border-color 120ms ease;
}

.github-actor-link--pill:hover,
.github-actor-link--pill:focus-visible {
  background-color: var(--ui-selected);
  border-color: var(--border);
}
</style>

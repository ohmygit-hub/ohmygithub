<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@oh-my-github/ui'
import { createGitHubAvatarUrl, createOrganizationWorkspaceUrl } from './github-reference'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  login: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
}>(), {
  size: 'sm',
  interactive: true,
})

const router = useRouter()

const normalizedLogin = computed(() => props.login.trim())
const fallback = computed(() => normalizedLogin.value.slice(0, 1).toUpperCase())
const avatarSrc = computed(() => props.avatarUrl || createGitHubAvatarUrl(normalizedLogin.value))
const avatarClass = computed(() => {
  if (props.size === 'xs') return 'size-4'
  if (props.size === 'md') return 'size-7'
  if (props.size === 'lg') return 'size-9'
  if (props.size === 'xl') return 'size-20'

  return 'size-5'
})
const fallbackClass = computed(() => {
  if (props.size === 'xs') return 'text-[9px]'
  if (props.size === 'lg') return 'text-caption'
  if (props.size === 'xl') return 'text-heading'

  return 'text-[10px]'
})
const rootClass = computed(() => [
  'inline-flex shrink-0 items-center justify-center rounded-md outline-hidden',
  props.interactive
    ? 'cursor-pointer transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/30'
    : '',
])

function openOrganization(): void {
  if (!props.interactive || !normalizedLogin.value) return

  void router.push(createOrganizationWorkspaceUrl(normalizedLogin.value))
}
</script>

<template>
  <button
    v-if="interactive"
    v-bind="$attrs"
    :aria-label="normalizedLogin"
    :class="rootClass"
    :title="normalizedLogin"
    type="button"
    @click.stop="openOrganization"
  >
    <Avatar
      class="rounded-md"
      :class="avatarClass"
    >
      <AvatarImage
        :alt="normalizedLogin"
        :src="avatarSrc"
      />
      <AvatarFallback
        class="rounded-md"
        :class="fallbackClass"
      >
        {{ fallback }}
      </AvatarFallback>
    </Avatar>
  </button>

  <span
    v-else
    v-bind="$attrs"
    :class="rootClass"
    :title="normalizedLogin"
  >
    <Avatar
      class="rounded-md"
      :class="avatarClass"
    >
      <AvatarImage
        :alt="normalizedLogin"
        :src="avatarSrc"
      />
      <AvatarFallback
        class="rounded-md"
        :class="fallbackClass"
      >
        {{ fallback }}
      </AvatarFallback>
    </Avatar>
  </span>
</template>

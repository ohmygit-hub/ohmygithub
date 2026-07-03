<script setup lang="ts">
import { computed, ref, watch } from 'vue'

defineOptions({
  inheritAttrs: false,
})

interface MarkdownImageNode {
  src: string
  alt?: string
  title?: string | null
  raw?: string
}

const props = defineProps<{
  node: MarkdownImageNode
}>()

const SHIELDS_COLOR_ACCENTS: Record<string, string> = {
  brightgreen: 'green',
  green: 'green',
  success: 'green',
  yellowgreen: 'yellow',
  yellow: 'yellow',
  gold: 'yellow',
  orange: 'orange',
  important: 'orange',
  red: 'red',
  critical: 'red',
  crimson: 'red',
  blue: 'blue',
  informational: 'blue',
  lightblue: 'blue',
  purple: 'purple',
  blueviolet: 'purple',
  violet: 'purple',
  pink: 'pink',
  teal: 'teal',
  cyan: 'teal',
  brown: 'brown',
  gray: 'gray',
  grey: 'gray',
  lightgray: 'gray',
  lightgrey: 'gray',
  inactive: 'gray',
}

const fallbackSrc = ref<string | null>(null)
const displaySrc = computed(() => fallbackSrc.value ?? props.node.src)
const shieldsBadge = computed(() => parseShieldsBadge(props.node.src))
const shieldsBadgeStyle = computed(() => {
  const accent = SHIELDS_COLOR_ACCENTS[shieldsBadge.value?.color ?? ''] ?? 'gray'

  return {
    backgroundColor: `var(--accent-${accent}-soft-active)`,
    color: `var(--accent-${accent}-deep)`,
  }
})
const imageStyle = computed(() => {
  const height = dimensionAttributeToCssValue(rawAttributeValue('height'))
  const width = dimensionAttributeToCssValue(rawAttributeValue('width'))
  const style: Record<string, string> = {
    height: 'auto',
    maxWidth: '100%',
  }

  if (width) style.width = width
  else if (height) style.maxHeight = height

  return style
})

watch(
  () => props.node.src,
  () => {
    fallbackSrc.value = null
  },
)

function parseShieldsBadge(src: string): { label: string; color: string } | null {
  try {
    const url = new URL(src)
    if (url.hostname !== 'img.shields.io') return null

    const match = url.pathname.match(/^\/badge\/([^/]+)$/)
    if (!match) return null

    // Shields static badge path is `<label>-<color>` or `<label>-<message>-<color>`,
    // with `--` escaping a literal dash inside a segment.
    const segments = decodeURIComponent(match[1])
      .split(/(?<!-)-(?!-)/)
      .map((segment) => segment.replace(/--/g, '-').replace(/_/g, ' ').trim())
      .filter(Boolean)
    if (segments.length < 2) return null

    const color = segments[segments.length - 1].toLowerCase()
    const label = segments.slice(0, -1).join(' ')
    if (!label) return null

    return { label, color }
  } catch {
    return null
  }
}

function handleError(): void {
  const fallback = githubRawFallback(displaySrc.value)
  if (!fallback || fallback === displaySrc.value || fallbackSrc.value === fallback) return

  fallbackSrc.value = fallback
}

function githubRawFallback(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.hostname !== 'github.com') return null

    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
    if (!match) return null

    const [, owner, repo, ref, path] = match
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`
  } catch {
    return null
  }
}

function rawAttributeValue(attribute: string): string | null {
  const raw = props.node.raw ?? ''
  const pattern = new RegExp(`\\s${attribute}=(["']?)([^\\s"'<>]+)\\1`, 'i')

  return raw.match(pattern)?.[2] ?? null
}

function dimensionAttributeToCssValue(value: string | null): string | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  if (/^\d+(?:\.\d+)?$/.test(trimmedValue)) return `${trimmedValue}px`
  if (/^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|vmin|vmax|%)$/i.test(trimmedValue)) {
    return trimmedValue
  }

  return null
}
</script>

<template>
  <span
    v-if="shieldsBadge"
    class="rich-content-shields-badge"
    :style="shieldsBadgeStyle"
    :title="props.node.title ?? undefined"
  >
    {{ shieldsBadge.label }}
  </span>
  <img
    v-else
    class="rich-content-image"
    :src="displaySrc"
    :alt="props.node.alt ?? ''"
    :title="props.node.title ?? undefined"
    :style="imageStyle"
    decoding="async"
    loading="eager"
    @error="handleError"
  >
</template>

<style scoped>
.rich-content-shields-badge {
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.1875rem 0.4375rem;
  vertical-align: middle;
  white-space: nowrap;
}
</style>

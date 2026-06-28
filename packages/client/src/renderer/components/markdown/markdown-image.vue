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

const fallbackSrc = ref<string | null>(null)
const displaySrc = computed(() => fallbackSrc.value ?? props.node.src)
const imageStyle = computed(() => {
  const height = dimensionAttributeToCssValue(rawAttributeValue('height'))
  const width = dimensionAttributeToCssValue(rawAttributeValue('width'))
  const style: Record<string, string> = {}

  if (height) {
    style.height = height
    if (!width) style.width = 'auto'
  }

  if (width) {
    style.width = width
  }

  return style
})

watch(
  () => props.node.src,
  () => {
    fallbackSrc.value = null
  },
)

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
  <img
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

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  workspaceUrl: string
}>()

const router = useRouter()

function openWorkspaceUrl(): void {
  void router.push(props.workspaceUrl)
}
</script>

<template>
  <a
    v-bind="$attrs"
    class="text-primary underline-offset-4 outline-hidden hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/30"
    :href="workspaceUrl"
    @click.prevent.stop="openWorkspaceUrl"
  >
    <slot />
  </a>
</template>

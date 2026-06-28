<script setup lang="ts">
import { computed } from 'vue'
import ShikiCode from './shiki-code.vue'

const props = withDefaults(defineProps<{
  patch?: string
  original?: string
  modified?: string
  filename?: string
}>(), {
  filename: undefined,
  modified: undefined,
  original: undefined,
  patch: undefined
})

const diffCode = computed(() => {
  if (props.patch) return props.patch

  const original = props.original ?? ''
  const modified = props.modified ?? ''

  return [
    ...original.split(/\r?\n/).map((line) => `-${line}`),
    ...modified.split(/\r?\n/).map((line) => `+${line}`)
  ].join('\n')
})
</script>

<template>
  <ShikiCode
    :code="diffCode"
    :filename="props.filename"
    language="diff"
  />
</template>

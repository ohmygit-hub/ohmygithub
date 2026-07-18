<script setup lang="ts">
import type { ThemedToken } from 'shiki'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageSquare, MessageSquarePlus } from 'lucide-vue-next'
import { useCodeTheme } from '../code/code-theme'
import { parseDiff } from '../code/parse-diff'
import { useShikiTokenizer } from '../code/use-shiki-highlighter'
import {
  buildReviewDiffRows,
  extendReviewDiffRange,
  type ReviewDiffAnchor,
  type ReviewDiffRange,
  type ReviewDiffRow,
} from './review-diff-selection'

export interface ReviewDiffMarker {
  threadId: string
  side: 'LEFT' | 'RIGHT'
  line: number
  count: number
  isResolved: boolean
  isPending: boolean
}

const props = defineProps<{
  patch: string
  filename: string
  markers?: ReviewDiffMarker[]
  selection?: ReviewDiffRange | null
}>()

const emit = defineEmits<{
  select: [range: ReviewDiffRange]
  locateThread: [threadId: string]
}>()

const { t } = useI18n()
const { themes } = useCodeTheme()
const { tokenize } = useShikiTokenizer()

const rows = computed(() => buildReviewDiffRows(parseDiff(props.patch)))
const tokensByRow = ref<ThemedToken[][] | null>(null)

let tokenizeRequest = 0
watch(
  () => [props.patch, props.filename, themes.value.light.name, themes.value.dark.name] as const,
  async ([patch, filename]) => {
    const requestId = ++tokenizeRequest
    const code = parseDiff(patch).map((line) => line.content).join('\n')
    const tokens = await tokenize(code, { filename, themes: themes.value })
    if (requestId === tokenizeRequest) tokensByRow.value = tokens
  },
  { immediate: true },
)

const gutterDigits = computed(() => {
  let max = 0
  for (const row of rows.value) {
    if (row.diff.oldLine && row.diff.oldLine > max) max = row.diff.oldLine
    if (row.diff.newLine && row.diff.newLine > max) max = row.diff.newLine
  }
  return Math.max(2, String(max).length)
})
const numberStyle = computed(() => ({ width: `${gutterDigits.value}ch` }))
const gutterStyle = computed(() => ({ width: `calc(${gutterDigits.value * 2}ch + 2.5rem)` }))

const markerByAnchor = computed(() => {
  const map = new Map<string, ReviewDiffMarker>()
  for (const marker of props.markers ?? []) {
    map.set(`${marker.side}:${marker.line}`, marker)
  }
  return map
})

const dragStart = ref<ReviewDiffAnchor | null>(null)
const dragRange = ref<ReviewDiffRange | null>(null)
const activeRange = computed(() => dragRange.value ?? props.selection ?? null)
const hoveredIndex = ref<number | null>(null)

function beginDrag(row: ReviewDiffRow): void {
  if (!row.anchor) return
  dragStart.value = row.anchor
  dragRange.value = extendReviewDiffRange(row.anchor, row.anchor)
  window.addEventListener('mouseup', endDrag)
}

function extendDrag(row: ReviewDiffRow): void {
  if (!dragStart.value) return
  dragRange.value = extendReviewDiffRange(dragStart.value, row.anchor)
}

function endDrag(): void {
  window.removeEventListener('mouseup', endDrag)
  if (dragRange.value) emit('select', dragRange.value)
  dragStart.value = null
  dragRange.value = null
}

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', endDrag)
})

function isRowSelected(row: ReviewDiffRow): boolean {
  const range = activeRange.value
  if (!range || !row.anchor || row.anchor.side !== range.side) return false
  const start = range.startLine ?? range.line
  return row.anchor.line >= start && row.anchor.line <= range.line
}

function rowMarker(row: ReviewDiffRow): ReviewDiffMarker | undefined {
  if (!row.anchor) return undefined
  return markerByAnchor.value.get(`${row.anchor.side}:${row.anchor.line}`)
}

function onRowEnter(row: ReviewDiffRow, index: number): void {
  hoveredIndex.value = index
  extendDrag(row)
}

// The comment-bubble hint surfaces the click/drag-to-select affordance at the
// hovered row; thread markers keep priority over the hint in the same slot.
function showCommentHint(row: ReviewDiffRow, index: number): boolean {
  return hoveredIndex.value === index
    && row.anchor !== null
    && !dragStart.value
    && !rowMarker(row)
}
</script>

<template>
  <div
    class="shiki review-diff min-w-0 font-mono text-body leading-relaxed"
    @mouseleave="hoveredIndex = null"
  >
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex min-w-0"
      :class="{
        'bg-diff-add': row.diff.type === 'add' && !isRowSelected(row),
        'bg-diff-remove': row.diff.type === 'del' && !isRowSelected(row),
        'bg-muted-foreground/10': row.diff.type === 'hunk',
        'bg-accent': isRowSelected(row),
      }"
      @mouseenter="onRowEnter(row, index)"
    >
      <template v-if="row.diff.type === 'hunk'">
        <div
          class="shrink-0 select-none"
          :style="gutterStyle"
        />
        <div class="flex-1 select-none whitespace-pre px-2 text-muted-foreground">
          {{ row.diff.content }}
        </div>
      </template>
      <template v-else>
        <div
          class="relative flex shrink-0 select-none items-center justify-end gap-1 pr-1 text-right tabular-nums text-muted-foreground"
          :class="row.anchor ? 'cursor-pointer hover:text-foreground' : ''"
          :style="gutterStyle"
          @mousedown.prevent="beginDrag(row)"
        >
          <span
            v-if="showCommentHint(row, index)"
            aria-hidden="true"
            class="absolute left-0.5 inline-flex items-center text-muted-foreground"
          >
            <MessageSquarePlus class="size-3.5" />
          </span>
          <button
            v-if="rowMarker(row)"
            :aria-label="t('pullRequest.review.diff.viewThread')"
            class="absolute left-0.5 inline-flex select-none items-center gap-0.5 rounded-sm px-0.5 text-caption hover:bg-accent"
            :class="rowMarker(row)?.isResolved ? 'text-muted-foreground' : 'text-foreground'"
            type="button"
            @click="emit('locateThread', rowMarker(row)!.threadId)"
            @mousedown.stop
          >
            <MessageSquare class="size-3" />
            <span>{{ rowMarker(row)!.count }}</span>
          </button>
          <span
            class="inline-block"
            :style="numberStyle"
          >{{ row.diff.oldLine ?? '' }}</span>
          <span
            class="inline-block"
            :style="numberStyle"
          >{{ row.diff.newLine ?? '' }}</span>
        </div>
        <div class="w-4 shrink-0 select-none text-center text-muted-foreground">
          {{ row.diff.type === 'add' ? '+' : row.diff.type === 'del' ? '-' : ' ' }}
        </div>
        <div class="min-w-0 flex-1 whitespace-pre pr-2">
          <template v-if="tokensByRow?.[index]">
            <span
              v-for="(token, tokenIndex) in tokensByRow[index]"
              :key="tokenIndex"
              :style="token.htmlStyle ?? (token.color ? { color: token.color } : undefined)"
            >{{ token.content }}</span>
          </template>
          <span
            v-else
            class="text-foreground"
          >{{ row.diff.content }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

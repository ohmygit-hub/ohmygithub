<script setup lang="ts">
import type {
  ConversationCommentActionLabels,
  ConversationCommentActionPayload,
  ConversationCommentSavePayload,
  ConversationActor,
  ConversationBadge,
  ConversationComment,
  ConversationReaction,
} from './types'
import { computed, ref, watch } from 'vue'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
} from '@oh-my-github/ui'
import { Check, MoreHorizontal, Pencil, Trash2, X } from 'lucide-vue-next'
import GitHubMarkdownRenderer from '../github/github-markdown-renderer.vue'
import MarkdownRenderer from '../markdown/markdown-renderer.vue'
import ConversationActorLine from './conversation-actor-line.vue'
import ConversationReactionBar from './conversation-reaction-bar.vue'
import { hasRenderableText } from './format'

const props = defineProps<{
  commentId?: string
  comment?: ConversationComment
  actor?: ConversationActor | null
  author?: ConversationActor | null
  body?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  badges?: ConversationBadge[]
  reactions?: ConversationReaction[]
  emptyLabel?: string
  showAvatar?: boolean
  owner?: string | null
  repo?: string | null
  editable?: boolean
  deletable?: boolean
  isEditing?: boolean
  isSaving?: boolean
  isDeleting?: boolean
  actionLabels?: ConversationCommentActionLabels
}>()

const emit = defineEmits<{
  cancel: [payload: ConversationCommentActionPayload]
  delete: [payload: ConversationCommentActionPayload]
  edit: [payload: ConversationCommentActionPayload]
  save: [payload: ConversationCommentSavePayload]
}>()

const resolvedCommentId = computed(() => {
  const id = props.commentId ?? props.comment?.id

  return id === undefined ? undefined : String(id)
})
const resolvedActor = computed(() =>
  props.actor
  ?? props.author
  ?? props.comment?.actor
  ?? props.comment?.author
  ?? null
)
const resolvedBody = computed(() => props.body ?? props.comment?.body ?? '')
const resolvedCreatedAt = computed(() => props.createdAt ?? props.comment?.createdAt)
const resolvedUpdatedAt = computed(() => props.updatedAt ?? props.comment?.updatedAt)
const resolvedBadges = computed(() => props.badges ?? props.comment?.badges ?? [])
const resolvedReactions = computed(() => props.reactions ?? props.comment?.reactions ?? [])
const hasBody = computed(() => hasRenderableText(resolvedBody.value))
const hasReactions = computed(() => resolvedReactions.value.some((reaction) => reaction.count > 0))
const labels = computed(() => props.actionLabels ?? {})
const hasDefaultActions = computed(() => Boolean(props.editable || props.deletable))
const localIsEditing = ref(false)
const editBody = ref('')
const isEditing = computed(() => props.isEditing ?? localIsEditing.value)
const isBusy = computed(() => Boolean(props.isSaving || props.isDeleting))
const hasEditBody = computed(() => hasRenderableText(editBody.value))
const canSaveEdit = computed(() => hasEditBody.value && !isBusy.value)

watch(
  resolvedBody,
  (body) => {
    if (!isEditing.value) {
      editBody.value = body
    }
  },
  { immediate: true },
)

watch(
  isEditing,
  (editing) => {
    if (editing) {
      editBody.value = resolvedBody.value
    }
  },
)

function actionPayload(): ConversationCommentActionPayload {
  return {
    comment: props.comment,
    commentId: resolvedCommentId.value,
  }
}

function setLocalEditing(value: boolean): void {
  if (props.isEditing === undefined) {
    localIsEditing.value = value
  }
}

function startEdit(): void {
  if (!props.editable || isEditing.value || isBusy.value) return

  editBody.value = resolvedBody.value
  setLocalEditing(true)
  emit('edit', actionPayload())
}

function cancelEdit(): void {
  if (isBusy.value) return

  editBody.value = resolvedBody.value
  setLocalEditing(false)
  emit('cancel', actionPayload())
}

function saveEdit(): void {
  if (!canSaveEdit.value) return

  emit('save', {
    ...actionPayload(),
    body: editBody.value,
  })
}

function deleteComment(): void {
  if (!props.deletable || isBusy.value) return

  emit('delete', actionPayload())
}
</script>

<template>
  <Card
    :id="resolvedCommentId"
    :data-comment-id="resolvedCommentId"
    class="gap-0 overflow-hidden rounded-lg py-0"
  >
    <div
      v-if="resolvedActor || $slots.actions || hasDefaultActions"
      class="flex min-h-10 min-w-0 items-center justify-between gap-3 border-b border-border px-3 py-1.5"
    >
      <ConversationActorLine
        v-if="resolvedActor"
        class="min-w-0 flex-1"
        :actor="resolvedActor"
        :badges="resolvedBadges"
        :created-at="resolvedCreatedAt"
        :show-avatar="showAvatar ?? true"
        :updated-at="resolvedUpdatedAt"
      />

      <div
        v-if="$slots.actions || hasDefaultActions"
        class="flex shrink-0 items-center gap-1"
      >
        <slot name="actions" />

        <DropdownMenu v-if="hasDefaultActions">
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="labels.actions"
              class="size-8 text-muted-foreground"
              :disabled="isBusy"
              :loading="isDeleting"
              loading-mode="overlay"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-if="editable"
              :disabled="isBusy || isEditing"
              @select="startEdit"
            >
              <Pencil class="size-3.5" />
              <span
                v-if="labels.edit || $slots['edit-action-label']"
                class="select-none"
              >
                <slot name="edit-action-label">
                  {{ labels.edit }}
                </slot>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="deletable"
              :disabled="isBusy"
              variant="destructive"
              @select="deleteComment"
            >
              <Trash2 class="size-3.5" />
              <span
                v-if="labels.delete || $slots['delete-action-label']"
                class="select-none"
              >
                <slot name="delete-action-label">
                  {{ labels.delete }}
                </slot>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div
      v-if="isEditing || hasBody || emptyLabel"
      class="min-w-0 px-3 py-2"
    >
      <form
        v-if="isEditing"
        class="grid min-w-0 gap-3"
        @submit.prevent="saveEdit"
      >
        <div class="grid min-w-0 gap-3 md:grid-cols-2">
          <div class="grid min-w-0 gap-1.5">
            <div
              v-if="labels.write || $slots['edit-write-label']"
              class="select-none text-label font-medium text-foreground"
            >
              <slot name="edit-write-label">
                {{ labels.write }}
              </slot>
            </div>
            <Textarea
              v-model="editBody"
              :aria-label="labels.input || labels.write"
              class="min-h-32"
              :disabled="isBusy"
              :placeholder="labels.placeholder"
              size="lg"
            />
          </div>

          <div class="grid min-w-0 gap-1.5">
            <div
              v-if="labels.preview || $slots['edit-preview-label']"
              class="select-none text-label font-medium text-foreground"
            >
              <slot name="edit-preview-label">
                {{ labels.preview }}
              </slot>
            </div>
            <div class="min-h-32 min-w-0 overflow-auto rounded-md border border-border bg-background/60 p-3">
              <MarkdownRenderer
                v-if="hasEditBody && !(owner && repo)"
                class="rich-content-markdown--compact"
                :content="editBody"
              />
              <GitHubMarkdownRenderer
                v-else-if="hasEditBody"
                class="rich-content-markdown--compact"
                :content="editBody"
                :owner="owner"
                :repo="repo"
              />
              <p
                v-else-if="labels.emptyPreview || $slots['edit-empty-preview']"
                class="select-none text-body text-muted-foreground"
              >
                <slot name="edit-empty-preview">
                  {{ labels.emptyPreview }}
                </slot>
              </p>
            </div>
          </div>
        </div>

        <div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <Button
            :disabled="isBusy"
            size="sm"
            type="button"
            variant="ghost"
            @click="cancelEdit"
          >
            <X class="size-3.5" />
            <span
              v-if="labels.cancel || $slots['edit-cancel-label']"
              class="select-none"
            >
              <slot name="edit-cancel-label">
                {{ labels.cancel }}
              </slot>
            </span>
          </Button>
          <Button
            :disabled="!canSaveEdit"
            :loading="isSaving"
            loading-mode="leading"
            size="sm"
            type="submit"
          >
            <Check class="size-3.5" />
            <span
              v-if="labels.save || $slots['edit-save-label']"
              class="select-none"
            >
              <slot name="edit-save-label">
                {{ labels.save }}
              </slot>
            </span>
          </Button>
        </div>
      </form>

      <template v-else>
        <MarkdownRenderer
          v-if="hasBody && !(owner && repo)"
          class="rich-content-markdown--compact"
          :content="resolvedBody"
        />
        <GitHubMarkdownRenderer
          v-else-if="hasBody"
          class="rich-content-markdown--compact"
          :content="resolvedBody"
          :owner="owner"
          :repo="repo"
        />
        <p
          v-else-if="emptyLabel"
          class="text-body text-muted-foreground"
        >
          {{ emptyLabel }}
        </p>
      </template>
    </div>

    <div
      v-if="hasReactions || $slots.footer"
      class="flex items-center border-t border-border px-3 py-2"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
        <ConversationReactionBar
          v-if="hasReactions"
          :reactions="resolvedReactions"
        />
        <div
          v-if="$slots.footer"
          class="min-w-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Card>
</template>

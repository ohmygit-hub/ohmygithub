<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag } from 'lucide-vue-next'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  Textarea,
} from '@oh-my-github/ui'
import GitHubBranchSelect from '@/components/github/github-branch-select.vue'
import { createRelease, updateRelease } from '@/composables/github/use-releases'

const props = defineProps<{
  open: boolean
  owner: string
  repo: string
  defaultBranch: string | null
  release: GitHubRelease | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  saved: [release: GitHubRelease, mode: 'create' | 'edit']
}>()

const { t } = useI18n()

const tagName = ref('')
const targetCommitish = ref<string | null>(null)
const title = ref('')
const body = ref('')
const draft = ref(false)
const prerelease = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const showTagError = ref(false)

const isEdit = computed(() => props.release !== null)
const isPublishedRelease = computed(() => isEdit.value && !props.release?.draft)
const canSubmit = computed(() => Boolean(tagName.value.trim()) && !isSubmitting.value)

watch(
  () => props.open,
  (open) => {
    if (open) prepare()
  }
)

function prepare(): void {
  tagName.value = props.release?.tagName ?? ''
  targetCommitish.value = props.release?.targetCommitish || props.defaultBranch
  title.value = props.release?.name ?? ''
  body.value = props.release?.body ?? ''
  draft.value = props.release?.draft ?? false
  prerelease.value = props.release?.prerelease ?? false
  isSubmitting.value = false
  errorMessage.value = null
  showTagError.value = false
}

function setOpen(open: boolean): void {
  if (!open && isSubmitting.value) return
  emit('update:open', open)
}

async function submit(): Promise<void> {
  const tag = tagName.value.trim()

  if (!tag) {
    showTagError.value = true
    return
  }
  if (isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload = {
      tagName: tag,
      targetCommitish: targetCommitish.value,
      name: title.value.trim(),
      body: body.value,
      prerelease: prerelease.value,
      draft: isPublishedRelease.value ? undefined : draft.value,
    }
    const release = props.release
      ? await updateRelease(props.owner, props.repo, props.release.id, payload)
      : await createRelease({ owner: props.owner, repo: props.repo, ...payload })

    emit('saved', release, isEdit.value ? 'edit' : 'create')
    emit('update:open', false)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error) ?? t('repository.releases.form.error')
  } finally {
    isSubmitting.value = false
  }
}

function extractErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/, '')
    .replace(/^Error:\s*/, '')
    .trim()

  return message || null
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="setOpen"
  >
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ t(isEdit ? 'repository.releases.form.editTitle' : 'repository.releases.form.createTitle') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('repository.releases.form.description', { repo: `${owner}/${repo}` }) }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="grid gap-4"
        @submit.prevent="submit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label for="release-form-tag">{{ t('repository.releases.form.tagLabel') }}</Label>
            <Input
              id="release-form-tag"
              v-model="tagName"
              autocomplete="off"
              :disabled="isSubmitting"
              :placeholder="t('repository.releases.form.tagPlaceholder')"
              spellcheck="false"
              @input="showTagError = false"
            />
            <p
              v-if="showTagError"
              class="text-body text-destructive"
            >
              {{ t('repository.releases.form.tagRequired') }}
            </p>
          </div>

          <div class="grid gap-1.5">
            <Label for="release-form-target">{{ t('repository.releases.form.targetLabel') }}</Label>
            <GitHubBranchSelect
              id="release-form-target"
              v-model="targetCommitish"
              :default-branch="defaultBranch"
              :owner="owner"
              :repo="repo"
              trigger-class="w-full"
            />
            <p class="text-caption text-muted-foreground">
              {{ t('repository.releases.form.targetHint') }}
            </p>
          </div>
        </div>

        <div class="grid gap-1.5">
          <Label for="release-form-title">{{ t('repository.releases.form.titleLabel') }}</Label>
          <Input
            id="release-form-title"
            v-model="title"
            autocomplete="off"
            :disabled="isSubmitting"
            :placeholder="t('repository.releases.form.titlePlaceholder')"
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="release-form-body">{{ t('repository.releases.form.bodyLabel') }}</Label>
          <Textarea
            id="release-form-body"
            v-model="body"
            class="max-h-72 min-h-40 text-body"
            :disabled="isSubmitting"
            :placeholder="t('repository.releases.form.bodyPlaceholder')"
            spellcheck="false"
          />
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Label
            v-if="!isPublishedRelease"
            class="flex items-center gap-2 font-normal"
          >
            <Checkbox
              :disabled="isSubmitting"
              :model-value="draft"
              @update:model-value="(value) => draft = value === true"
            />
            {{ t('repository.releases.form.draftLabel') }}
          </Label>
          <Label class="flex items-center gap-2 font-normal">
            <Checkbox
              :disabled="isSubmitting"
              :model-value="prerelease"
              @update:model-value="(value) => prerelease = value === true"
            />
            {{ t('repository.releases.form.prereleaseLabel') }}
          </Label>
        </div>

        <p
          v-if="errorMessage"
          class="text-body text-destructive"
        >
          {{ errorMessage }}
        </p>

        <DialogFooter>
          <Button
            :disabled="isSubmitting"
            type="button"
            variant="outline"
            @click="setOpen(false)"
          >
            {{ t('repository.releases.form.cancel') }}
          </Button>
          <Button
            :disabled="!canSubmit"
            type="submit"
          >
            <Spinner
              v-if="isSubmitting"
              class="size-3.5"
            />
            <Tag
              v-else
              class="size-3.5"
              :stroke-width="1.75"
            />
            {{ t(isEdit ? 'repository.releases.form.save' : 'repository.releases.form.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

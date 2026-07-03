<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@oh-my-github/ui'
import {
  deleteRelease,
  publishRelease,
  useRepositoryReleasesQuery,
} from '@/composables/github/use-releases'
import { useToast } from '@/composables/use-toast'
import ReleaseFormDialog from './release-form-dialog.vue'
import ReleaseList from './list.vue'

const props = defineProps<{
  owner: string
  repo: string
  defaultBranch: string | null
}>()

const PER_PAGE = 20

const { t } = useI18n()
const toast = useToast()
const page = ref(1)
const isFormOpen = ref(false)
const editingRelease = ref<GitHubRelease | null>(null)
const deletingRelease = ref<GitHubRelease | null>(null)
const isDeleting = ref(false)
const publishingReleaseId = ref<number | null>(null)

const hasRepositoryIdentity = computed(() => Boolean(props.owner && props.repo))
const releasesQuery = useRepositoryReleasesQuery(
  () => props.owner,
  () => props.repo,
  page,
  () => PER_PAGE,
  hasRepositoryIdentity,
)
const result = computed(() => releasesQuery.data.value ?? null)
const releases = computed(() => result.value?.items ?? [])
const hasNextPage = computed(() => result.value?.hasNextPage ?? false)
const isLoading = computed(() => releasesQuery.isLoading.value)
const hasError = computed(() => Boolean(releasesQuery.error.value))
const latestReleaseId = computed(() => {
  if (page.value !== 1) return null

  return releases.value.find((release) => !release.draft && !release.prerelease)?.id ?? null
})
const orderedReleases = computed(() => {
  const items = releases.value
  const index = latestReleaseId.value === null
    ? -1
    : items.findIndex((release) => release.id === latestReleaseId.value)

  if (index <= 0) return items

  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)]
})

watch(
  () => [props.owner, props.repo] as const,
  () => {
    page.value = 1
  },
)

function refetchReleases(): void {
  void releasesQuery.refetch()
}

function openCreate(): void {
  editingRelease.value = null
  isFormOpen.value = true
}

function openEdit(release: GitHubRelease): void {
  editingRelease.value = release
  isFormOpen.value = true
}

function handleSaved(_release: GitHubRelease, mode: 'create' | 'edit'): void {
  toast.success(t(mode === 'create' ? 'repository.releases.toasts.created' : 'repository.releases.toasts.updated'))

  if (mode === 'create') {
    page.value = 1
  }

  refetchReleases()
}

async function publish(release: GitHubRelease): Promise<void> {
  if (publishingReleaseId.value !== null) return

  publishingReleaseId.value = release.id

  try {
    await publishRelease(props.owner, props.repo, release.id)
    toast.success(t('repository.releases.toasts.published'))
    refetchReleases()
  } catch (error) {
    toast.error(t('repository.releases.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    publishingReleaseId.value = null
  }
}

async function confirmDelete(): Promise<void> {
  const release = deletingRelease.value
  if (!release || isDeleting.value) return

  isDeleting.value = true

  try {
    await deleteRelease(props.owner, props.repo, release.id)
    toast.success(t('repository.releases.toasts.deleted'))
    deletingRelease.value = null
    refetchReleases()
  } catch (error) {
    toast.error(t('repository.releases.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isDeleting.value = false
  }
}

function resolveErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/, '')
    .replace(/^Error:\s*/, '')
    .trim()

  return message || undefined
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="grid min-w-0 gap-1">
        <h2 class="select-none truncate text-title font-semibold text-foreground">
          {{ t('repository.releases.title') }}
        </h2>
        <p class="select-none text-body text-muted-foreground">
          {{ t('repository.releases.description') }}
        </p>
      </div>
      <Button
        :disabled="!hasRepositoryIdentity"
        size="sm"
        type="button"
        @click="openCreate"
      >
        <Plus
          class="size-3.5"
          :stroke-width="1.75"
        />
        {{ t('repository.releases.create') }}
      </Button>
    </div>

    <ReleaseList
      :has-error="hasError"
      :has-identity="hasRepositoryIdentity"
      :has-next-page="hasNextPage"
      :is-loading="isLoading"
      :latest-release-id="latestReleaseId"
      :owner="owner"
      :page="page"
      :per-page="PER_PAGE"
      :releases="orderedReleases"
      :repo="repo"
      @delete="deletingRelease = $event"
      @edit="openEdit"
      @publish="publish"
      @retry="refetchReleases"
      @update:page="page = $event"
    />

    <ReleaseFormDialog
      v-model:open="isFormOpen"
      :default-branch="defaultBranch"
      :owner="owner"
      :release="editingRelease"
      :repo="repo"
      @saved="handleSaved"
    />

    <Dialog
      :open="deletingRelease !== null"
      @update:open="(open) => { if (!open && !isDeleting) deletingRelease = null }"
    >
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('repository.releases.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('repository.releases.delete.description', { tag: deletingRelease?.tagName ?? '' }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isDeleting"
            size="sm"
            type="button"
            variant="outline"
            @click="deletingRelease = null"
          >
            {{ t('repository.releases.delete.cancel') }}
          </Button>
          <Button
            :disabled="isDeleting"
            size="sm"
            type="button"
            variant="destructive"
            @click="confirmDelete"
          >
            <Spinner
              v-if="isDeleting"
              class="size-3.5"
            />
            {{ t('repository.releases.delete.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

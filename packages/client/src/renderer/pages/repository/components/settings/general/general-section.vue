<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink, Pencil } from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@oh-my-github/ui'
import GithubBranchSelect from '@/components/github/github-branch-select.vue'
import { renameBranch } from '@/composables/github/use-repositories'
import {
  updateGeneralSettings,
  useRepositoryGeneralSettingsQuery,
  useRepositorySettingsInvalidation,
} from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import SettingsRow from '@/pages/settings/components/appearance-settings/settings-row.vue'
import BasicsForm from './basics-form.vue'
import MergeOptionsForm from './merge-options-form.vue'
import DangerZone from './danger-zone.vue'

const props = defineProps<{
  owner: string
  repo: string
}>()

const emit = defineEmits<{
  renamed: [newName: string]
  deleted: []
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateGeneralSettings, invalidateRepositoryOverview } = useRepositorySettingsInvalidation()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const settingsQuery = useRepositoryGeneralSettingsQuery(
  () => props.owner,
  () => props.repo,
  hasIdentity,
)
const settings = computed(() => settingsQuery.data.value ?? null)
const isLoading = computed(() => settingsQuery.isLoading.value)
const hasError = computed(() => Boolean(settingsQuery.error.value))

const selectedDefaultBranch = ref<string | null>(null)
const isSavingDefaultBranch = ref(false)
const isRenameDialogOpen = ref(false)
const renameBranchName = ref('')
const isRenamingBranch = ref(false)
const renameErrorMessage = ref<string | null>(null)

watch(settings, (value) => {
  selectedDefaultBranch.value = value?.defaultBranch ?? null
}, { immediate: true })

const isDefaultBranchDirty = computed(() =>
  Boolean(selectedDefaultBranch.value)
  && selectedDefaultBranch.value !== (settings.value?.defaultBranch ?? null))

const EXTERNAL_LINKS = [
  { id: 'socialPreview', labelKey: 'repository.settings.general.externalLinks.socialPreview' },
  { id: 'wikiRestrict', labelKey: 'repository.settings.general.externalLinks.wikiRestrict' },
  { id: 'lfsArchives', labelKey: 'repository.settings.general.externalLinks.lfsArchives' },
] as const

function refresh(): void {
  invalidateGeneralSettings(props.owner, props.repo)
  invalidateRepositoryOverview(props.owner, props.repo)
}

function retry(): void {
  void settingsQuery.refetch()
}

async function saveDefaultBranch(): Promise<void> {
  const next = selectedDefaultBranch.value
  if (!next || !isDefaultBranchDirty.value || isSavingDefaultBranch.value) return
  isSavingDefaultBranch.value = true

  try {
    await updateGeneralSettings(props.owner, props.repo, { defaultBranch: next })
    refresh()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.general.saveError'))
  } finally {
    isSavingDefaultBranch.value = false
  }
}

function openRenameDialog(): void {
  renameBranchName.value = settings.value?.defaultBranch ?? ''
  renameErrorMessage.value = null
  isRenameDialogOpen.value = true
}

async function confirmRenameBranch(): Promise<void> {
  const current = settings.value?.defaultBranch
  const next = renameBranchName.value.trim()
  if (!current || !next || next === current || isRenamingBranch.value) return

  isRenamingBranch.value = true
  renameErrorMessage.value = null

  try {
    await renameBranch(props.owner, props.repo, current, next)
    isRenameDialogOpen.value = false
    refresh()
  } catch (error) {
    renameErrorMessage.value = error instanceof Error
      ? error.message
      : t('repository.settings.general.saveError')
  } finally {
    isRenamingBranch.value = false
  }
}

function handleRenamed(newName: string): void {
  refresh()
  emit('renamed', newName)
}

function handleDeleted(): void {
  emit('deleted')
}

function openExternal(): void {
  const url = `https://github.com/${encodeURIComponent(props.owner)}/${encodeURIComponent(props.repo)}/settings`
  void window.ohMyGithub?.links?.openExternalUrl(url)
}
</script>

<template>
  <div
    v-if="isLoading"
    class="flex min-h-[16rem] items-center justify-center"
  >
    <Spinner class="size-5 text-muted-foreground" />
  </div>

  <div
    v-else-if="hasError || !settings"
    class="grid min-h-[12rem] place-content-center gap-3 text-center"
  >
    <p class="text-body text-destructive">
      {{ t('repository.settings.general.loadError') }}
    </p>
    <Button
      class="justify-self-center"
      size="sm"
      type="button"
      variant="outline"
      @click="retry"
    >
      {{ t('repository.settings.general.retry') }}
    </Button>
  </div>

  <div
    v-else
    class="mx-auto w-full max-w-3xl space-y-8 px-2"
  >
    <BasicsForm
      :owner="owner"
      :repo="repo"
      :settings="settings"
      @renamed="handleRenamed"
      @saved="refresh"
    />

    <SettingsSection :title="t('repository.settings.general.defaultBranch.title')">
      <SettingsRow
        :description="t('repository.settings.general.defaultBranch.description')"
        :label="t('repository.settings.general.defaultBranch.title')"
      >
        <div class="flex items-center gap-2">
          <GithubBranchSelect
            v-model="selectedDefaultBranch"
            :default-branch="settings.defaultBranch"
            :owner="owner"
            :repo="repo"
            trigger-class="w-52"
            trigger-size="sm"
          />
          <Button
            v-if="isDefaultBranchDirty"
            :disabled="isSavingDefaultBranch"
            size="sm"
            type="button"
            @click="saveDefaultBranch"
          >
            <Spinner
              v-if="isSavingDefaultBranch"
              class="size-3.5"
            />
            {{ t('repository.settings.general.defaultBranch.save') }}
          </Button>
          <Button
            v-if="settings.defaultBranch"
            size="sm"
            type="button"
            variant="outline"
            @click="openRenameDialog"
          >
            <Pencil
              class="size-3.5"
              :stroke-width="1.75"
            />
            {{ t('repository.settings.general.defaultBranch.rename') }}
          </Button>
        </div>
      </SettingsRow>
    </SettingsSection>

    <MergeOptionsForm
      :owner="owner"
      :repo="repo"
      :settings="settings"
      @refresh="refresh"
    />

    <DangerZone
      :owner="owner"
      :repo="repo"
      :settings="settings"
      @deleted="handleDeleted"
      @refresh="refresh"
    />

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <button
        v-for="link in EXTERNAL_LINKS"
        :key="link.id"
        class="inline-flex items-center gap-1 text-caption text-muted-foreground underline-offset-4 outline-hidden hover:underline focus-visible:underline"
        type="button"
        @click="openExternal"
      >
        {{ t(link.labelKey) }}
        <ExternalLink
          class="size-3"
          :stroke-width="1.75"
        />
      </button>
    </div>

    <Dialog v-model:open="isRenameDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('repository.settings.general.defaultBranch.renameTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('repository.settings.general.defaultBranch.renameDescription', { name: settings.defaultBranch ?? '' }) }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-1.5">
          <Label for="repository-default-branch-rename">
            {{ t('repository.settings.general.defaultBranch.renameLabel') }}
          </Label>
          <Input
            id="repository-default-branch-rename"
            v-model="renameBranchName"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <p
          v-if="renameErrorMessage"
          class="text-body text-destructive"
        >
          {{ renameErrorMessage }}
        </p>

        <DialogFooter>
          <Button
            :disabled="isRenamingBranch"
            size="sm"
            type="button"
            variant="outline"
            @click="isRenameDialogOpen = false"
          >
            {{ t('repository.settings.general.dangerZone.cancel') }}
          </Button>
          <Button
            :disabled="isRenamingBranch || !renameBranchName.trim() || renameBranchName.trim() === settings.defaultBranch"
            size="sm"
            type="button"
            @click="confirmRenameBranch"
          >
            <Spinner
              v-if="isRenamingBranch"
              class="size-3.5"
            />
            {{ t('repository.settings.general.defaultBranch.renameConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

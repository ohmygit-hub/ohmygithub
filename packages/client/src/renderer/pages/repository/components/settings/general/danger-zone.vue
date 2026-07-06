<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { useRouter } from 'vue-router'
import {
  deleteRepository,
  transferRepository,
  updateGeneralSettings,
} from '@/composables/github/use-repository-settings'
import { findMissingScopes, useAuthStateQuery } from '@/composables/github/use-user-settings'
import { useToast } from '@/composables/use-toast'
import SettingsRow from '@/pages/settings/components/appearance-settings/settings-row.vue'
import { isDangerConfirmed } from './danger-confirm'

type DangerAction = 'visibility' | 'transfer' | 'archive' | 'delete'

const props = defineProps<{
  owner: string
  repo: string
  settings: GitHubRepositoryGeneralSettings
}>()

const emit = defineEmits<{
  refresh: []
  deleted: []
}>()

const { t } = useI18n()
const toast = useToast()
const router = useRouter()
const { data: authState } = useAuthStateQuery()

const activeAction = ref<DangerAction | null>(null)
const confirmText = ref('')
const transferOwner = ref('')
const transferName = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const missingDeleteScopes = computed(() => findMissingScopes(authState.value ?? null, ['delete_repo']))
const nextVisibility = computed(() => (props.settings.visibility === 'private' ? 'public' : 'private'))
const fullName = computed(() => `${props.owner}/${props.repo}`)
const requiresConfirmText = computed(() => activeAction.value !== 'archive')
const canConfirm = computed(() => {
  if (isSubmitting.value) return false
  if (activeAction.value === 'transfer' && !transferOwner.value.trim()) return false
  if (!requiresConfirmText.value) return true

  return isDangerConfirmed(confirmText.value, props.owner, props.repo)
})

watch(activeAction, () => {
  confirmText.value = ''
  transferOwner.value = ''
  transferName.value = ''
  errorMessage.value = null
  isSubmitting.value = false
})

function openAction(action: DangerAction): void {
  activeAction.value = action
}

function closeDialog(open: boolean): void {
  if (!open && !isSubmitting.value) {
    activeAction.value = null
  }
}

async function confirmAction(): Promise<void> {
  const action = activeAction.value
  if (!action || !canConfirm.value) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    if (action === 'visibility') {
      await updateGeneralSettings(props.owner, props.repo, { visibility: nextVisibility.value })
    } else if (action === 'archive') {
      await updateGeneralSettings(props.owner, props.repo, { archived: !props.settings.isArchived })
    } else if (action === 'transfer') {
      await transferRepository(
        props.owner,
        props.repo,
        transferOwner.value.trim(),
        transferName.value.trim() || undefined,
      )
      toast.info(t('repository.settings.general.dangerZone.transfer.pending'))
    } else {
      await deleteRepository(props.owner, props.repo)
      emit('deleted')
      activeAction.value = null
      return
    }

    activeAction.value = null
    emit('refresh')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : t('repository.settings.general.saveError')
  } finally {
    isSubmitting.value = false
  }
}

function goToAuth(): void {
  void router.push('/auth')
}

const dialogTitleKey = computed(() => {
  if (activeAction.value === 'visibility') return 'repository.settings.general.dangerZone.visibility.confirmTitle'
  if (activeAction.value === 'transfer') return 'repository.settings.general.dangerZone.transfer.title'
  if (activeAction.value === 'archive') return 'repository.settings.general.dangerZone.archive.confirmTitle'
  return 'repository.settings.general.dangerZone.delete.confirmTitle'
})

const dialogDescriptionKey = computed(() => {
  if (activeAction.value === 'visibility') return 'repository.settings.general.dangerZone.visibility.confirmDescription'
  if (activeAction.value === 'transfer') return 'repository.settings.general.dangerZone.transfer.confirmDescription'
  if (activeAction.value === 'archive') return 'repository.settings.general.dangerZone.archive.confirmDescription'
  return 'repository.settings.general.dangerZone.delete.confirmDescription'
})
</script>

<template>
  <section class="space-y-2.5">
    <div class="flex min-h-7 items-center px-2">
      <h3 class="select-none text-caption font-medium text-destructive">
        {{ t('repository.settings.general.dangerZone.title') }}
      </h3>
    </div>

    <div class="overflow-hidden rounded-[var(--radius-menu-shell)] border border-destructive/40 bg-card">
      <SettingsRow
        :description="t('repository.settings.general.dangerZone.visibility.description', { visibility: settings.visibility })"
        :label="t('repository.settings.general.dangerZone.visibility.title')"
      >
        <Button
          size="sm"
          type="button"
          variant="outline"
          @click="openAction('visibility')"
        >
          {{ t(settings.visibility === 'private'
            ? 'repository.settings.general.dangerZone.visibility.makePublic'
            : 'repository.settings.general.dangerZone.visibility.makePrivate') }}
        </Button>
      </SettingsRow>

      <SettingsRow
        :description="t('repository.settings.general.dangerZone.transfer.description')"
        :label="t('repository.settings.general.dangerZone.transfer.title')"
      >
        <Button
          size="sm"
          type="button"
          variant="outline"
          @click="openAction('transfer')"
        >
          {{ t('repository.settings.general.dangerZone.transfer.action') }}
        </Button>
      </SettingsRow>

      <SettingsRow
        :description="t('repository.settings.general.dangerZone.archive.description')"
        :label="t('repository.settings.general.dangerZone.archive.title')"
      >
        <Button
          size="sm"
          type="button"
          variant="outline"
          @click="openAction('archive')"
        >
          {{ t(settings.isArchived
            ? 'repository.settings.general.dangerZone.archive.unarchiveAction'
            : 'repository.settings.general.dangerZone.archive.archiveAction') }}
        </Button>
      </SettingsRow>

      <SettingsRow
        :description="missingDeleteScopes.length > 0
          ? t('repository.settings.general.dangerZone.delete.missingScope')
          : t('repository.settings.general.dangerZone.delete.description')"
        :label="t('repository.settings.general.dangerZone.delete.title')"
      >
        <Button
          v-if="missingDeleteScopes.length > 0"
          size="sm"
          type="button"
          variant="outline"
          @click="goToAuth"
        >
          {{ t('repository.settings.general.dangerZone.delete.reauthorize') }}
        </Button>
        <Button
          v-else
          size="sm"
          type="button"
          variant="destructive"
          @click="openAction('delete')"
        >
          {{ t('repository.settings.general.dangerZone.delete.action') }}
        </Button>
      </SettingsRow>
    </div>

    <Dialog
      :open="activeAction !== null"
      @update:open="closeDialog"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t(dialogTitleKey) }}</DialogTitle>
          <DialogDescription>
            {{ t(dialogDescriptionKey, { name: fullName }) }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="activeAction === 'transfer'"
          class="grid gap-3"
        >
          <div class="grid gap-1.5">
            <Label for="repository-transfer-owner">
              {{ t('repository.settings.general.dangerZone.transfer.newOwner') }}
            </Label>
            <Input
              id="repository-transfer-owner"
              v-model="transferOwner"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="grid gap-1.5">
            <Label for="repository-transfer-name">
              {{ t('repository.settings.general.dangerZone.transfer.newName') }}
            </Label>
            <Input
              id="repository-transfer-name"
              v-model="transferName"
              autocomplete="off"
              :placeholder="repo"
              spellcheck="false"
            />
          </div>
        </div>

        <div
          v-if="requiresConfirmText"
          class="grid gap-1.5"
        >
          <Label for="repository-danger-confirm">
            {{ t('repository.settings.general.dangerZone.confirmLabel', { name: fullName }) }}
          </Label>
          <Input
            id="repository-danger-confirm"
            v-model="confirmText"
            autocomplete="off"
            :placeholder="fullName"
            spellcheck="false"
          />
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
            size="sm"
            type="button"
            variant="outline"
            @click="closeDialog(false)"
          >
            {{ t('repository.settings.general.dangerZone.cancel') }}
          </Button>
          <Button
            :disabled="!canConfirm"
            size="sm"
            type="button"
            variant="destructive"
            @click="confirmAction"
          >
            <Spinner
              v-if="isSubmitting"
              class="size-3.5"
            />
            {{ t('repository.settings.general.dangerZone.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

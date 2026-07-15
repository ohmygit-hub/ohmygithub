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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@oh-my-github/ui'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import SettingsBlock from '@/pages/settings/components/appearance-settings/settings-block.vue'
import SettingsRow from '@/pages/settings/components/appearance-settings/settings-row.vue'
import { deleteTeam, updateTeam, useTeamInvalidation } from '@/composables/github/use-organization-teams'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  org: string
  team: GitHubTeam
}>()

const emit = defineEmits<{
  deleted: []
  renamed: [teamSlug: string]
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateTeamDetail } = useTeamInvalidation()

const name = ref(props.team.name)
const description = ref(props.team.description ?? '')
const privacy = ref<GitHubTeamPrivacy>(props.team.privacy)
const isSaving = ref(false)
const isDeleteOpen = ref(false)
const isDeleting = ref(false)

// GitHub rejects secret child teams, so nested teams keep visibility pinned.
const privacyLocked = computed(() => props.team.parentSlug !== null)
const hasChanges = computed(() =>
  name.value.trim() !== props.team.name
  || description.value.trim() !== (props.team.description ?? '')
  || privacy.value !== props.team.privacy
)
const canSave = computed(() => hasChanges.value && name.value.trim().length > 0 && !isSaving.value)

watch(
  () => props.team,
  (team) => {
    name.value = team.name
    description.value = team.description ?? ''
    privacy.value = team.privacy
  },
)

async function save(): Promise<void> {
  if (!canSave.value) return

  isSaving.value = true

  try {
    const updated = await updateTeam({
      org: props.org,
      teamSlug: props.team.slug,
      name: name.value.trim(),
      description: description.value.trim(),
      ...(privacyLocked.value ? {} : { privacy: privacy.value }),
    })
    toast.success(t('teams.settings.toasts.saved'))
    invalidateTeamDetail(props.org, props.team.slug)
    emit('renamed', updated.slug || props.team.slug)
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (isDeleting.value) return

  isDeleting.value = true

  try {
    await deleteTeam({ org: props.org, teamSlug: props.team.slug })
    toast.success(t('teams.settings.dangerZone.deleted', { name: props.team.name }))
    isDeleteOpen.value = false
    emit('deleted')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
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
  <div class="mx-auto w-full max-w-3xl space-y-8 px-2">
    <SettingsSection :title="t('teams.settings.title')">
      <template #actions>
        <Button
          v-if="hasChanges"
          :disabled="!canSave"
          size="sm"
          type="button"
          @click="save"
        >
          <Spinner
            v-if="isSaving"
            class="size-3.5"
          />
          {{ t('teams.settings.save') }}
        </Button>
      </template>

      <SettingsRow
        :description="t('teams.settings.renameHint')"
        :label="t('teams.settings.nameLabel')"
      >
        <Input
          v-model="name"
          autocomplete="off"
          class="w-64"
          spellcheck="false"
        />
      </SettingsRow>

      <SettingsBlock :label="t('teams.settings.descriptionLabel')">
        <Input
          v-model="description"
          autocomplete="off"
        />
      </SettingsBlock>

      <SettingsRow
        :description="privacyLocked ? t('teams.create.privacyLockedHint') : ''"
        :label="t('teams.settings.privacyLabel')"
      >
        <Select
          v-model="privacy"
          :disabled="privacyLocked"
        >
          <SelectTrigger
            :aria-label="t('teams.settings.privacyLabel')"
            class="w-40"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="visible">
              {{ t('teams.privacy.visible') }}
            </SelectItem>
            <SelectItem value="secret">
              {{ t('teams.privacy.secret') }}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>
    </SettingsSection>

    <section class="space-y-2.5">
      <div class="flex min-h-7 items-center px-2">
        <h3 class="select-none text-caption font-medium text-destructive">
          {{ t('teams.settings.dangerZone.title') }}
        </h3>
      </div>

      <div class="overflow-hidden rounded-[var(--radius-menu-shell)] border border-destructive/40 bg-card">
        <SettingsRow
          :description="t('teams.settings.dangerZone.deleteDescription')"
          :label="t('teams.settings.dangerZone.deleteTitle')"
        >
          <Button
            size="sm"
            type="button"
            variant="destructive"
            @click="isDeleteOpen = true"
          >
            {{ t('teams.settings.dangerZone.delete') }}
          </Button>
        </SettingsRow>
      </div>
    </section>

    <Dialog
      :open="isDeleteOpen"
      @update:open="(open) => { if (!isDeleting) isDeleteOpen = open }"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('teams.settings.dangerZone.confirmTitle', { name: team.name }) }}</DialogTitle>
          <DialogDescription>
            {{ t('teams.settings.dangerZone.confirmDescription', { name: team.name, org }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isDeleting"
            size="sm"
            type="button"
            variant="outline"
            @click="isDeleteOpen = false"
          >
            {{ t('teams.settings.dangerZone.cancel') }}
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
            {{ t('teams.settings.dangerZone.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

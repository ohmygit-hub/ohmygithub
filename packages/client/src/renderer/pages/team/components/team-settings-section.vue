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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@oh-my-github/ui'
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

function resetForm(): void {
  name.value = props.team.name
  description.value = props.team.description ?? ''
  privacy.value = props.team.privacy
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
  <section class="grid gap-3">
    <div class="grid gap-4 rounded-lg border border-border bg-card p-4">
      <p class="select-none text-label font-medium text-foreground">
        {{ t('teams.settings.title') }}
      </p>

      <div class="grid gap-3">
        <div class="grid gap-1.5">
          <Label for="team-settings-name">{{ t('teams.settings.nameLabel') }}</Label>
          <Input
            id="team-settings-name"
            v-model="name"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="text-caption text-muted-foreground">
            {{ t('teams.settings.renameHint') }}
          </p>
        </div>

        <div class="grid gap-1.5">
          <Label for="team-settings-description">{{ t('teams.settings.descriptionLabel') }}</Label>
          <Input
            id="team-settings-description"
            v-model="description"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="team-settings-privacy">{{ t('teams.settings.privacyLabel') }}</Label>
          <Select
            v-model="privacy"
            :disabled="privacyLocked"
          >
            <SelectTrigger
              id="team-settings-privacy"
              class="w-full sm:w-64"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visible">
                {{ t('teams.privacy.visible') }}
              </SelectItem>
              <SelectItem value="secret">
                {{ t('teams.privacy.secret') }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="privacyLocked"
            class="text-caption text-muted-foreground"
          >
            {{ t('teams.create.privacyLockedHint') }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <Button
          v-if="hasChanges"
          :disabled="isSaving"
          size="sm"
          type="button"
          variant="outline"
          @click="resetForm"
        >
          {{ t('teams.settings.reset') }}
        </Button>
        <Button
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
      </div>
    </div>

    <div class="grid gap-3 rounded-lg border border-destructive/40 bg-card p-4">
      <p class="select-none text-label font-medium text-foreground">
        {{ t('teams.settings.dangerZone.title') }}
      </p>

      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <p class="min-w-0 flex-1 text-body text-muted-foreground">
          {{ t('teams.settings.dangerZone.deleteDescription') }}
        </p>
        <Button
          size="sm"
          type="button"
          variant="destructive"
          @click="isDeleteOpen = true"
        >
          {{ t('teams.settings.dangerZone.delete') }}
        </Button>
      </div>
    </div>

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
  </section>
</template>

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
import LocalSearchSelect from '@/components/github/local-search-select.vue'
import type { LocalSearchSelectItem } from '@/components/github/local-search-select-types'
import { createTeam, useTeamInvalidation } from '@/composables/github/use-organization-teams'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  defaultParentSlug?: string | null
  open: boolean
  org: string
  teams: GitHubTeam[]
}>()

const emit = defineEmits<{
  created: [team: GitHubCreatedTeam]
  'update:open': [open: boolean]
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateTeams, invalidateAllTeamDetails } = useTeamInvalidation()

const name = ref('')
const description = ref('')
const privacy = ref<GitHubTeamPrivacy>('visible')
const parentSearch = ref('')
const parentSlug = ref<string | null>(null)
const isCreating = ref(false)

const parentItems = computed<LocalSearchSelectItem[]>(() =>
  props.teams.map((team) => ({
    id: team.slug,
    label: team.name,
    sublabel: team.slug,
    avatarUrl: team.avatarUrl,
  }))
)
const parentTeam = computed(() =>
  parentSlug.value ? props.teams.find((team) => team.slug === parentSlug.value) ?? null : null
)
// GitHub rejects secret child teams, so a picked parent pins the visibility.
const privacyLocked = computed(() => parentTeam.value !== null)
const canSubmit = computed(() => name.value.trim().length > 0 && !isCreating.value)

watch(
  () => props.open,
  (open) => {
    if (!open) return

    name.value = ''
    description.value = ''
    privacy.value = 'visible'
    parentSlug.value = props.defaultParentSlug ?? null
    parentSearch.value = parentTeam.value?.name ?? ''
  },
)

watch(privacyLocked, (locked) => {
  if (locked) {
    privacy.value = 'visible'
  }
})

// Editing the picker text past the picked team's name drops the selection so
// stale picks never ride along silently.
watch(parentSearch, (value) => {
  if (parentTeam.value && value !== parentTeam.value.name) {
    parentSlug.value = null
  }
})

function selectParent(item: LocalSearchSelectItem): void {
  parentSlug.value = item.id
}

function clearParent(): void {
  parentSlug.value = null
  parentSearch.value = ''
}

async function submit(): Promise<void> {
  const teamName = name.value.trim()
  if (!teamName || isCreating.value) return

  isCreating.value = true

  try {
    const created = await createTeam({
      org: props.org,
      name: teamName,
      ...(description.value.trim() ? { description: description.value.trim() } : {}),
      privacy: privacy.value,
      ...(parentTeam.value && parentTeam.value.id > 0 ? { parentTeamId: parentTeam.value.id } : {}),
    })
    toast.success(t('teams.create.success', { name: created.name || teamName }))
    invalidateTeams(props.org)
    invalidateAllTeamDetails(props.org)
    emit('update:open', false)
    emit('created', created)
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isCreating.value = false
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
  <Dialog
    :open="open"
    @update:open="(value) => { if (!isCreating) emit('update:open', value) }"
  >
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('teams.create.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('teams.create.description', { org }) }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="grid gap-3"
        @submit.prevent="submit"
      >
        <div class="grid gap-1.5">
          <Label for="team-create-name">{{ t('teams.create.nameLabel') }}</Label>
          <Input
            id="team-create-name"
            v-model="name"
            autocomplete="off"
            :placeholder="t('teams.create.namePlaceholder')"
            spellcheck="false"
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="team-create-description">
            {{ t('teams.create.descriptionLabel') }}
            <span class="ml-1 font-normal text-muted-foreground">({{ t('teams.create.optional') }})</span>
          </Label>
          <Input
            id="team-create-description"
            v-model="description"
            autocomplete="off"
            :placeholder="t('teams.create.descriptionPlaceholder')"
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="team-create-privacy">{{ t('teams.create.privacyLabel') }}</Label>
          <Select
            v-model="privacy"
            :disabled="privacyLocked"
          >
            <SelectTrigger
              id="team-create-privacy"
              class="w-full"
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

        <div
          v-if="teams.length > 0"
          class="grid gap-1.5"
        >
          <div class="flex items-center justify-between gap-2">
            <Label for="team-create-parent">
              {{ t('teams.create.parentLabel') }}
              <span class="ml-1 font-normal text-muted-foreground">({{ t('teams.create.optional') }})</span>
            </Label>
            <button
              v-if="parentSlug"
              class="text-caption text-muted-foreground underline-offset-4 hover:underline"
              type="button"
              @click="clearParent"
            >
              {{ t('teams.create.clearParent') }}
            </button>
          </div>
          <LocalSearchSelect
            v-model="parentSearch"
            :empty-label="t('teams.create.parentEmpty')"
            input-id="team-create-parent"
            :items="parentItems"
            :placeholder="t('teams.create.parentPlaceholder')"
            @select="selectParent"
          />
        </div>
      </form>

      <DialogFooter>
        <Button
          :disabled="isCreating"
          size="sm"
          type="button"
          variant="outline"
          @click="emit('update:open', false)"
        >
          {{ t('teams.create.cancel') }}
        </Button>
        <Button
          :disabled="!canSubmit"
          size="sm"
          type="button"
          @click="submit"
        >
          <Spinner
            v-if="isCreating"
            class="size-3.5"
          />
          {{ t('teams.create.submit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

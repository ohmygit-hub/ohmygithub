<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@oh-my-github/ui'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import LocalSearchSelect from '@/components/github/local-search-select.vue'
import type { LocalSearchSelectItem } from '@/components/github/local-search-select-types'
import { useOrganizationTeamsQuery } from '@/composables/github/use-organization-teams'
import { removeTeamAccess, setTeamAccess } from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'

const TEAM_PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const

const props = defineProps<{
  owner: string
  repo: string
  overview: GitHubRepositoryAccessOverview
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const toast = useToast()

const isAddDialogOpen = ref(false)
const newTeamSearch = ref('')
const newTeamSlug = ref<string | null>(null)
const newPermission = ref<string>('pull')
const isAdding = ref(false)
const addError = ref<string | null>(null)
const pendingKeys = ref(new Set<string>())

// The owner is the organization on this panel; the shared teams query feeds
// a picker so nobody has to type a slug from memory.
const organizationTeamsQuery = useOrganizationTeamsQuery(() => props.owner, isAddDialogOpen)
const grantedSlugs = computed(() => new Set(props.overview.teams.map((team) => team.slug.toLowerCase())))
const teamItems = computed<LocalSearchSelectItem[]>(() =>
  (organizationTeamsQuery.data.value?.teams ?? [])
    .filter((team) => !grantedSlugs.value.has(team.slug.toLowerCase()))
    .map((team) => ({
      id: team.slug,
      label: team.name,
      sublabel: team.slug,
      avatarUrl: team.avatarUrl,
    }))
)
const selectedTeamItem = computed(() =>
  newTeamSlug.value
    ? teamItems.value.find((item) => item.id === newTeamSlug.value) ?? null
    : null
)

watch(isAddDialogOpen, (open) => {
  if (open) {
    newTeamSearch.value = ''
    newTeamSlug.value = null
    newPermission.value = 'pull'
    addError.value = null
  }
})

watch(newTeamSearch, (value) => {
  if (selectedTeamItem.value && value !== selectedTeamItem.value.label) {
    newTeamSlug.value = null
  }
})

function selectTeamItem(item: LocalSearchSelectItem): void {
  newTeamSlug.value = item.id
}

// Falls back to the typed slug so teams beyond the list cap stay addable.
function resolveNewTeamSlug(): string {
  return newTeamSlug.value ?? newTeamSearch.value.trim()
}

function isPending(key: string): boolean {
  return pendingKeys.value.has(key)
}

async function run(key: string, action: () => Promise<void>): Promise<void> {
  if (pendingKeys.value.has(key)) return
  pendingKeys.value = new Set([...pendingKeys.value, key])

  try {
    await action()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.access.error'))
  } finally {
    const next = new Set(pendingKeys.value)
    next.delete(key)
    pendingKeys.value = next
    emit('refresh')
  }
}

async function add(): Promise<void> {
  const slug = resolveNewTeamSlug()
  if (!slug || isAdding.value) return
  isAdding.value = true
  addError.value = null

  try {
    await setTeamAccess(props.owner, slug, props.owner, props.repo, newPermission.value)
    isAddDialogOpen.value = false
    emit('refresh')
  } catch (error) {
    addError.value = error instanceof Error ? error.message : t('repository.settings.access.error')
  } finally {
    isAdding.value = false
  }
}

function changePermission(slug: string, value: unknown): void {
  if (typeof value !== 'string') return
  void run(`team:${slug}`, () => setTeamAccess(props.owner, slug, props.owner, props.repo, value))
}

function remove(slug: string): void {
  void run(`remove:${slug}`, () => removeTeamAccess(props.owner, slug, props.owner, props.repo))
}
</script>

<template>
  <SettingsSection :title="t('repository.settings.access.tabs.teams')">
    <template #actions>
      <Button
        size="sm"
        type="button"
        variant="outline"
        @click="isAddDialogOpen = true"
      >
        <Plus class="size-4" />
        {{ t('repository.settings.access.teams.add') }}
      </Button>
    </template>

    <div class="divide-y divide-border">
      <p
        v-if="overview.teams.length === 0"
        class="px-4 py-6 text-center text-body text-muted-foreground"
      >
        {{ t('repository.settings.access.teams.empty') }}
      </p>

      <div
        v-for="team in overview.teams"
        :key="team.slug"
        class="flex items-center justify-between gap-4 px-4 py-3"
      >
        <div class="grid min-w-0 gap-0.5">
          <span class="truncate text-control font-medium text-foreground">{{ team.name }}</span>
          <span class="truncate text-caption text-muted-foreground">{{ team.org }}/{{ team.slug }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Select
            :disabled="isPending(`team:${team.slug}`)"
            :model-value="team.permission"
            @update:model-value="changePermission(team.slug, $event)"
          >
            <SelectTrigger
              class="min-w-28"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem
                v-if="!TEAM_PERMISSIONS.includes(team.permission as typeof TEAM_PERMISSIONS[number])"
                :value="team.permission"
              >
                {{ team.permission }}
              </SelectItem>
              <SelectItem
                v-for="permission in TEAM_PERMISSIONS"
                :key="permission"
                :value="permission"
              >
                {{ t(`repository.settings.access.roles.${permission}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            :aria-label="t('repository.settings.access.teams.remove')"
            :disabled="isPending(`remove:${team.slug}`)"
            size="icon-sm"
            variant="ghost"
            @click="remove(team.slug)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </SettingsSection>

  <Dialog v-model:open="isAddDialogOpen">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ t('repository.settings.access.teams.addTitle') }}</DialogTitle>
      </DialogHeader>

      <form
        class="grid gap-3"
        @submit.prevent="add"
      >
        <div class="grid gap-1.5">
          <Label for="team-slug">{{ t('repository.settings.access.teams.addPlaceholder') }}</Label>
          <LocalSearchSelect
            v-model="newTeamSearch"
            :empty-label="t('repository.settings.access.teams.pickerEmpty')"
            input-id="team-slug"
            :items="teamItems"
            :placeholder="t('repository.settings.access.teams.pickerPlaceholder')"
            @select="selectTeamItem"
          />
        </div>
        <div class="grid gap-1.5">
          <Label>{{ t('repository.settings.access.collaborators.role') }}</Label>
          <Select v-model="newPermission">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="permission in TEAM_PERMISSIONS"
                :key="permission"
                :value="permission"
              >
                {{ t(`repository.settings.access.roles.${permission}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p
          v-if="addError"
          class="text-body text-destructive"
        >
          {{ addError }}
        </p>
      </form>

      <DialogFooter>
        <Button
          :disabled="isAdding"
          size="sm"
          type="button"
          variant="outline"
          @click="isAddDialogOpen = false"
        >
          {{ t('repository.settings.general.dangerZone.cancel') }}
        </Button>
        <Button
          :disabled="isAdding || !resolveNewTeamSlug()"
          size="sm"
          type="button"
          @click="add"
        >
          <Spinner
            v-if="isAdding"
            class="size-3.5"
          />
          {{ t('repository.settings.access.teams.add') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, Search, X } from 'lucide-vue-next'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Skeleton,
  Spinner,
} from '@oh-my-github/ui'
import { useAccountRepositoriesQuery } from '@/composables/github/use-accounts'
import AppPagination from '@/components/navigation/app-pagination.vue'
import { MAX_CUSTOM_PINS } from '../composables/use-custom-repository-pins'

const props = defineProps<{
  login: string
  open: boolean
  saving: boolean
  selected: GitHubAccountRepository[]
}>()

const emit = defineEmits<{
  save: [repositories: GitHubAccountRepository[]]
  'update:open': [open: boolean]
}>()

const PER_PAGE = 30
const SEARCH_DEBOUNCE_MS = 300

const { t } = useI18n()
const draft = ref<GitHubAccountRepository[]>([])
const searchInput = ref('')
const search = ref('')
const page = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const repositoriesQuery = useAccountRepositoriesQuery(
  () => props.login,
  page,
  () => PER_PAGE,
  search,
  () => props.open,
)
const repositoriesResult = computed(() => repositoriesQuery.data.value ?? null)
const repositories = computed(() => repositoriesResult.value?.items ?? [])
const isLoading = computed(() => repositoriesQuery.isLoading.value && repositories.value.length === 0)
const atCapacity = computed(() => draft.value.length >= MAX_CUSTOM_PINS)

watch(
  () => props.open,
  (open) => {
    if (!open) return

    draft.value = [...props.selected]
    searchInput.value = ''
    search.value = ''
    page.value = 1
  },
)

watch(searchInput, (value) => {
  clearSearchTimer()

  searchTimer = setTimeout(() => {
    search.value = value.trim()
    page.value = 1
    searchTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(clearSearchTimer)

function clearSearchTimer(): void {
  if (!searchTimer) return

  clearTimeout(searchTimer)
  searchTimer = null
}

function setOpen(open: boolean): void {
  if (props.saving) return

  emit('update:open', open)
}

function isSelected(repository: GitHubAccountRepository): boolean {
  return draft.value.some((entry) => entry.nameWithOwner === repository.nameWithOwner)
}

function toggleRepository(repository: GitHubAccountRepository): void {
  if (isSelected(repository)) {
    draft.value = draft.value.filter((entry) => entry.nameWithOwner !== repository.nameWithOwner)
    return
  }

  if (atCapacity.value) return

  draft.value = [...draft.value, repository]
}

function updateSearch(value: string | number): void {
  searchInput.value = String(value)
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="setOpen"
  >
    <DialogContent
      class="sm:max-w-lg"
      :show-close-button="!saving"
    >
      <DialogHeader>
        <DialogTitle>{{ t('account.overview.customPins.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('account.overview.customPins.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <InputGroup
            class="min-w-0 flex-1"
            size="sm"
          >
            <InputGroupAddon>
              <Search class="size-3.5 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              :disabled="saving"
              :model-value="searchInput"
              :placeholder="t('account.overview.customPins.searchPlaceholder')"
              type="search"
              @update:model-value="updateSearch"
            />
          </InputGroup>
          <span class="shrink-0 select-none text-body text-muted-foreground">
            {{ t('account.overview.customPins.selectedCount', { count: draft.length, max: MAX_CUSTOM_PINS }) }}
          </span>
        </div>

        <div
          v-if="draft.length > 0"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="repository in draft"
            :key="repository.nameWithOwner"
            class="inline-flex min-w-0 items-center gap-1 rounded-md border border-border bg-muted/50 py-0.5 pl-2 pr-1 text-body text-foreground"
          >
            <span class="truncate">{{ repository.name }}</span>
            <button
              class="rounded-sm p-0.5 text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
              :disabled="saving"
              type="button"
              @click="toggleRepository(repository)"
            >
              <X class="size-3" />
            </button>
          </span>
        </div>

        <div class="max-h-72 overflow-y-auto rounded-lg border border-border">
          <div
            v-if="isLoading"
            class="grid gap-2 p-2"
          >
            <Skeleton
              v-for="index in 6"
              :key="index"
              class="h-9 rounded-md"
            />
          </div>

          <div
            v-else-if="Boolean(repositoriesQuery.error.value)"
            class="grid justify-items-center gap-2 p-6 text-center text-body text-muted-foreground"
          >
            {{ t('account.overview.customPins.loadError') }}
            <Button
              size="sm"
              type="button"
              variant="outline"
              @click="repositoriesQuery.refetch()"
            >
              {{ t('account.error.retry') }}
            </Button>
          </div>

          <p
            v-else-if="repositories.length === 0"
            class="p-6 text-center text-body text-muted-foreground"
          >
            {{ t('account.overview.customPins.empty') }}
          </p>

          <template v-else>
            <label
              v-for="repository in repositories"
              :key="repository.nameWithOwner"
              class="flex min-w-0 cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                :disabled="saving || (!isSelected(repository) && atCapacity)"
                :model-value="isSelected(repository)"
                @update:model-value="toggleRepository(repository)"
              />
              <span class="grid min-w-0 flex-1 gap-0.5">
                <span class="flex min-w-0 items-center gap-1.5">
                  <span class="truncate text-label font-medium text-foreground">{{ repository.name }}</span>
                  <Lock
                    v-if="repository.isPrivate"
                    class="size-3 shrink-0 text-muted-foreground"
                  />
                </span>
                <span
                  v-if="repository.description"
                  class="truncate text-body text-muted-foreground"
                >
                  {{ repository.description }}
                </span>
              </span>
            </label>
          </template>
        </div>

        <AppPagination
          v-model:page="page"
          :disabled="saving || repositoriesQuery.isLoading.value"
          hide-when-single-page
          :per-page="PER_PAGE"
          summary-key="account.pagination.summary"
          :total-count="repositoriesResult?.totalCount ?? 0"
        />
      </div>

      <DialogFooter>
        <Button
          v-if="selected.length > 0"
          class="sm:mr-auto"
          :disabled="saving"
          type="button"
          variant="ghost"
          @click="emit('save', [])"
        >
          {{ t('account.overview.customPins.reset') }}
        </Button>
        <Button
          :disabled="saving"
          type="button"
          variant="outline"
          @click="setOpen(false)"
        >
          {{ t('account.overview.customPins.cancel') }}
        </Button>
        <Button
          :disabled="saving"
          type="button"
          @click="emit('save', draft)"
        >
          <Spinner
            v-if="saving"
            class="size-3.5"
          />
          {{ t('account.overview.customPins.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@oh-my-github/ui'
import { useOrganizationsQuery } from '@/composables/github/use-organizations'
import { useAccountListInvalidation } from '@/composables/github/use-accounts'
import {
  createRepository,
  useGitignoreTemplatesQuery,
  useLicenseTemplatesQuery,
} from '@/composables/github/use-repositories'
import { useToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/pages/settings/components/github/github-settings-utils'
import { createRepositoryWorkspaceUrl } from '@/pages/workspace/workspace-url'

const NONE_VALUE = 'none'
const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/

const props = defineProps<{
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  replaceActiveUrl: [url: string]
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateOwnedRepositories } = useAccountListInvalidation()
const organizationsQuery = useOrganizationsQuery()
const gitignoreTemplatesQuery = useGitignoreTemplatesQuery()
const licenseTemplatesQuery = useLicenseTemplatesQuery()

const viewerLogin = computed(() => props.viewer?.login ?? '')
const organizations = computed(() => organizationsQuery.data.value ?? [])
const gitignoreTemplates = computed(() => gitignoreTemplatesQuery.data.value ?? [])
const licenseTemplates = computed(() => licenseTemplatesQuery.data.value ?? [])
const templatesFailed = computed(() =>
  Boolean(gitignoreTemplatesQuery.error.value || licenseTemplatesQuery.error.value))

const form = reactive({
  owner: '',
  name: '',
  description: '',
  visibility: 'public' as 'public' | 'private',
  initReadme: false,
  gitignoreTemplate: NONE_VALUE,
  licenseTemplate: NONE_VALUE,
})
const nameError = ref('')
const isCreating = ref(false)

const selectedOwner = computed(() => form.owner || viewerLogin.value)

async function submit(): Promise<void> {
  if (isCreating.value) return

  nameError.value = ''
  const name = form.name.trim()

  if (!name) {
    nameError.value = t('newRepository.validation.nameRequired')
    return
  }

  if (!REPOSITORY_NAME_PATTERN.test(name)) {
    nameError.value = t('newRepository.validation.nameInvalid')
    return
  }

  isCreating.value = true

  try {
    const created = await createRepository({
      organization: selectedOwner.value === viewerLogin.value ? null : selectedOwner.value,
      name,
      description: form.description.trim() || null,
      visibility: form.visibility,
      autoInit: form.initReadme,
      gitignoreTemplate: form.gitignoreTemplate === NONE_VALUE ? null : form.gitignoreTemplate,
      licenseTemplate: form.licenseTemplate === NONE_VALUE ? null : form.licenseTemplate,
    })
    toast.success(t('newRepository.toasts.created', { name: created.nameWithOwner }))
    invalidateOwnedRepositories(created.owner)
    emit('replaceActiveUrl', createRepositoryWorkspaceUrl(created.owner, created.name))
  } catch (error) {
    const message = resolveErrorMessage(error)

    if (message && /already exists/i.test(message)) {
      nameError.value = message
    } else {
      toast.error(t('newRepository.toasts.createFailed'), { description: message })
    }
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <section class="min-h-full bg-background">
    <form
      class="mx-auto grid w-full max-w-2xl gap-6 px-6 py-8"
      @submit.prevent="submit"
    >
      <div class="grid gap-1">
        <h1 class="text-heading font-semibold text-foreground">
          {{ t('newRepository.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('newRepository.description') }}
        </p>
      </div>

      <div class="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)] items-end gap-3">
        <div class="grid gap-2">
          <Label for="new-repository-owner">{{ t('newRepository.fields.owner') }}</Label>
          <Select v-model="form.owner">
            <SelectTrigger
              id="new-repository-owner"
              class="w-full"
            >
              <SelectValue :placeholder="viewerLogin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="viewerLogin">
                {{ viewerLogin }}
              </SelectItem>
              <SelectItem
                v-for="organization in organizations"
                :key="organization.login"
                :value="organization.login"
              >
                {{ organization.login }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="new-repository-name">{{ t('newRepository.fields.name') }}</Label>
          <Input
            id="new-repository-name"
            v-model="form.name"
            autocomplete="off"
            :placeholder="t('newRepository.fields.namePlaceholder')"
            spellcheck="false"
          />
        </div>
      </div>
      <p
        v-if="nameError"
        class="-mt-4 text-sm text-destructive"
      >
        {{ nameError }}
      </p>

      <div class="grid gap-2">
        <Label for="new-repository-description">{{ t('newRepository.fields.description') }}</Label>
        <Input
          id="new-repository-description"
          v-model="form.description"
          autocomplete="off"
        />
      </div>

      <div class="grid gap-2">
        <Label>{{ t('newRepository.fields.visibility') }}</Label>
        <RadioGroup
          v-model="form.visibility"
          class="grid gap-2"
        >
          <label class="flex items-start gap-3">
            <RadioGroupItem
              class="mt-0.5"
              value="public"
            />
            <span class="grid gap-0.5">
              <span class="text-sm font-medium text-foreground">{{ t('newRepository.fields.public') }}</span>
              <span class="text-sm text-muted-foreground">{{ t('newRepository.fields.publicHint') }}</span>
            </span>
          </label>
          <label class="flex items-start gap-3">
            <RadioGroupItem
              class="mt-0.5"
              value="private"
            />
            <span class="grid gap-0.5">
              <span class="text-sm font-medium text-foreground">{{ t('newRepository.fields.private') }}</span>
              <span class="text-sm text-muted-foreground">{{ t('newRepository.fields.privateHint') }}</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      <label class="flex items-center gap-3">
        <Checkbox
          :model-value="form.initReadme"
          @update:model-value="(value) => form.initReadme = value === true"
        />
        <span class="text-sm text-foreground">{{ t('newRepository.fields.initReadme') }}</span>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-2">
          <Label for="new-repository-gitignore">{{ t('newRepository.fields.gitignore') }}</Label>
          <Select v-model="form.gitignoreTemplate">
            <SelectTrigger
              id="new-repository-gitignore"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="NONE_VALUE">
                {{ t('newRepository.fields.none') }}
              </SelectItem>
              <SelectItem
                v-for="template in gitignoreTemplates"
                :key="template"
                :value="template"
              >
                {{ template }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="new-repository-license">{{ t('newRepository.fields.license') }}</Label>
          <Select v-model="form.licenseTemplate">
            <SelectTrigger
              id="new-repository-license"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="NONE_VALUE">
                {{ t('newRepository.fields.none') }}
              </SelectItem>
              <SelectItem
                v-for="license in licenseTemplates"
                :key="license.key"
                :value="license.key"
              >
                {{ license.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p
        v-if="templatesFailed"
        class="-mt-4 text-sm text-muted-foreground"
      >
        {{ t('newRepository.templatesError') }}
      </p>

      <div class="flex justify-end border-t border-border pt-4">
        <Button
          :disabled="isCreating"
          type="submit"
        >
          <Spinner v-if="isCreating" />
          {{ t('newRepository.actions.create') }}
        </Button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchableSelect from '@/components/navigation/searchable-select.vue'
import type { SearchableSelectOption } from '@/components/navigation/searchable-select.vue'

const ALL_ENVIRONMENTS_VALUE = 'all'

const props = defineProps<{
  disabled?: boolean
  modelValue: string
  environments: GitHubEnvironment[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const options = computed<SearchableSelectOption[]>(() => [
  {
    id: ALL_ENVIRONMENTS_VALUE,
    label: t('repository.deployments.environments.all'),
  },
  ...props.environments.map((environment) => ({
    id: environment.name,
    label: environment.name,
  })),
])
</script>

<template>
  <SearchableSelect
    :disabled="disabled"
    :empty-label="t('repository.deployments.environments.selectEmpty')"
    :model-value="modelValue"
    :options="options"
    :placeholder="t('repository.deployments.environments.selectPlaceholder')"
    :search-placeholder="t('repository.deployments.environments.selectSearchPlaceholder')"
    :select-label="t('repository.deployments.environments.selectAriaLabel')"
    trigger-class="w-full sm:w-64"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

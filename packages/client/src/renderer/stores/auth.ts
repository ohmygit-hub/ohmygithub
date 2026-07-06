import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const state = ref<AuthState | null>(null)
  const isLoaded = ref(false)
  const isSwitching = ref(false)

  const isAuthenticated = computed(() => Boolean(state.value?.isAuthenticated))
  const viewer = computed(() => state.value?.auth?.viewer ?? null)
  const activeAccountId = computed(() => viewer.value?.id ?? null)
  const accounts = computed(() => state.value?.accounts ?? [])
  const otherAccounts = computed(() =>
    accounts.value.filter((account) => account.id !== activeAccountId.value)
  )

  async function refresh(): Promise<AuthState | null> {
    try {
      state.value = (await window.ohMyGithub?.auth?.get?.()) ?? null
    } catch {
      state.value = null
    }
    isLoaded.value = true
    return state.value
  }

  function applyState(next: AuthState | null): void {
    state.value = next
    isLoaded.value = true
  }

  return {
    state,
    isLoaded,
    isSwitching,
    isAuthenticated,
    viewer,
    activeAccountId,
    accounts,
    otherAccounts,
    refresh,
    applyState,
  }
})

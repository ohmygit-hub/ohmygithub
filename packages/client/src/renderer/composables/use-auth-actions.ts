import { useQueryCache } from '@pinia/colada'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Account transitions (switch / login / logout) share one soft-reload gate:
 * unmount the whole RouterView first (app.vue v-if), drop every cached
 * GitHub query, then navigate and remount with the new account's identity.
 * Removing entries (instead of invalidating) prevents the new account from
 * briefly seeing the previous account's stale data.
 */
export function useAuthActions() {
  const router = useRouter()
  const queryCache = useQueryCache()
  const authStore = useAuthStore()

  function clearGitHubQueryCache(): void {
    for (const entry of queryCache.getEntries({ key: ['github'] })) {
      queryCache.remove(entry)
    }
  }

  async function switchAccount(accountId: number): Promise<void> {
    if (authStore.isSwitching || accountId === authStore.activeAccountId) return

    authStore.isSwitching = true
    try {
      const next = await window.ohMyGithub?.auth?.switchAccount?.(accountId)

      if (!next) return

      clearGitHubQueryCache()
      authStore.applyState(next)
      await router.replace({ name: 'workspace-root' })
    } finally {
      authStore.isSwitching = false
    }
  }

  async function completeLogin(next: AuthState, redirectPath: string): Promise<void> {
    authStore.isSwitching = true
    try {
      clearGitHubQueryCache()
      authStore.applyState(next)
      await router.replace(redirectPath)
    } finally {
      authStore.isSwitching = false
    }
  }

  async function logout(): Promise<void> {
    if (authStore.isSwitching) return

    authStore.isSwitching = true
    try {
      const next = await window.ohMyGithub?.auth?.logout?.()
      clearGitHubQueryCache()
      authStore.applyState(next ?? null)
      await router.replace({ name: 'auth' })
    } finally {
      authStore.isSwitching = false
    }
  }

  return { switchAccount, completeLogin, logout }
}

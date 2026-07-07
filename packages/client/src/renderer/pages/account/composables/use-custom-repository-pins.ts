import type { MaybeRefOrGetter, Ref } from 'vue'
import { ref, toValue, watch } from 'vue'

export const MAX_CUSTOM_PINS = 6

/**
 * Viewer-chosen profile pins persisted to ~/.oh-my-github/pins.json through
 * the pins bridge. When set, they replace the GitHub pinned repositories on
 * the viewer's own account overview; an empty selection falls back to them.
 */
export function useCustomRepositoryPins(
  login: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
): {
  customPins: Ref<GitHubAccountRepository[]>
  saveCustomPins: (repositories: GitHubAccountRepository[]) => Promise<void>
} {
  const customPins = ref<GitHubAccountRepository[]>([])
  let restoreToken = 0

  watch(
    [() => normalizeLogin(toValue(login)), () => toValue(enabled)],
    ([normalizedLogin, isEnabled]) => {
      customPins.value = []
      if (!normalizedLogin || !isEnabled) return

      void restore(normalizedLogin)
    },
    { immediate: true },
  )

  async function restore(normalizedLogin: string): Promise<void> {
    const token = ++restoreToken

    try {
      const info = await window.ohMyGithub?.pins?.get?.()
      if (token !== restoreToken) return

      customPins.value = info?.pins?.repositoryPins?.[normalizedLogin] ?? []
    } catch (error) {
      console.error('Failed to restore custom repository pins', error)
    }
  }

  async function saveCustomPins(repositories: GitHubAccountRepository[]): Promise<void> {
    const normalizedLogin = normalizeLogin(toValue(login))
    const pinsBridge = window.ohMyGithub?.pins

    if (!normalizedLogin) return
    if (!pinsBridge?.setRepositoryPins) {
      throw new Error('Pins bridge is unavailable')
    }

    const info = await pinsBridge.setRepositoryPins({
      login: normalizedLogin,
      repositories: repositories.slice(0, MAX_CUSTOM_PINS),
    })
    restoreToken += 1
    customPins.value = info?.pins?.repositoryPins?.[normalizedLogin] ?? []
  }

  return {
    customPins,
    saveCustomPins,
  }
}

function normalizeLogin(value: string): string {
  return value.trim().toLowerCase()
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useWorkspaceTabs } from './use-workspace-tabs'

/* The composable persists tabs through localStorage, which does not exist in
   the node test environment. */
function stubLocalStorage(): void {
  const store = new Map<string, string>()

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  })
}

/* useWorkspaceTabs resolves the router through injection, so it runs inside an
   app context wired to a memory-history router that mirrors the app's
   catch-all workspace route. */
async function createWorkspaceTabsHarness(): Promise<ReturnType<typeof useWorkspaceTabs>> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', name: 'workspace', component: { render: () => null } }],
  })
  await router.push('/inbox')

  const app = createApp({ render: () => null })
  app.use(router)

  const workspaceTabs = app.runWithContext(() => useWorkspaceTabs())
  await nextTick()

  return workspaceTabs
}

async function settle(navigation: Promise<void>): Promise<void> {
  await navigation
  await nextTick()
}

describe('useWorkspaceTabs', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves the surviving tab history when closing tabs to the right', async () => {
    const { activeUrl, canGoBack, closeTabsToRight, selectTab, tabs } = await createWorkspaceTabsHarness()

    await settle(selectTab('/octo-org/hello-world'))
    await settle(selectTab('/inbox'))
    await settle(selectTab('/octo-org/hello-world'))
    expect(canGoBack.value).toBe(true)

    await settle(closeTabsToRight('/inbox'))

    expect(tabs.value.map((tab) => tab.url)).toEqual(['/inbox'])
    expect(activeUrl.value).toBe('/inbox')
    expect(canGoBack.value).toBe(true)
  })

  it('strips closed tabs from the history restored by going back', async () => {
    const { activeUrl, canGoBack, canGoForward, closeTabsToRight, goBack, selectTab, tabs } = await createWorkspaceTabsHarness()

    await settle(selectTab('/octo-org/hello-world'))
    await settle(selectTab('/octo-org/another-repo'))
    await settle(selectTab('/inbox'))

    await settle(closeTabsToRight('/octo-org/hello-world'))
    expect(tabs.value.map((tab) => tab.url)).toEqual(['/inbox', '/octo-org/hello-world'])
    expect(canGoBack.value).toBe(true)

    await settle(goBack())

    expect(activeUrl.value).toBe('/octo-org/hello-world')
    expect(tabs.value.map((tab) => tab.url)).toEqual(['/inbox', '/octo-org/hello-world'])
    expect(canGoForward.value).toBe(true)
  })
})

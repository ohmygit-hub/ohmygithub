import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { WorkspaceTab } from '@/pages/workspace/types'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DEFAULT_WORKSPACE_URL,
  createWorkspaceTabFromUrl,
  isReservedInternalPath,
  isWorkspaceTabType,
  routeToWorkspaceUrl,
} from '@/pages/workspace/workspace-url'

const STORAGE_KEY = 'oh-my-github:workspace-tabs:v1'
const STORAGE_VERSION = 1
const MAX_NAVIGATION_STACK_SIZE = 100

type WorkspaceNavigationIntent = 'push' | 'replace' | 'back' | 'forward'

interface WorkspaceNavigationSnapshot {
  activeUrl: string
  tabs: WorkspaceTab[]
}

interface StoredWorkspaceTabs {
  version: 1
  activeUrl: string
  tabs: WorkspaceTab[]
}

export function useWorkspaceTabs() {
  const route = useRoute()
  const router = useRouter()
  const restored = readStoredTabs()
  const tabs = ref<WorkspaceTab[]>(restored?.tabs ?? [createWorkspaceTabFromUrl(DEFAULT_WORKSPACE_URL)])
  const activeUrl = ref(restored?.activeUrl ?? tabs.value[0]?.url ?? DEFAULT_WORKSPACE_URL)
  const backStack = ref<WorkspaceNavigationSnapshot[]>([])
  const forwardStack = ref<WorkspaceNavigationSnapshot[]>([])
  let navigationIntent: WorkspaceNavigationIntent | null = null
  let pendingRestoreSnapshot: WorkspaceNavigationSnapshot | null = null

  const activeTab = computed(() => {
    return tabs.value.find((tab) => tab.url === activeUrl.value) ?? tabs.value[0]
  })
  const canGoBack = computed(() => backStack.value.length > 0)
  const canGoForward = computed(() => forwardStack.value.length > 0)

  async function selectTab(url: string): Promise<void> {
    await pushWorkspaceUrl(url)
  }

  async function openWorkspaceTab(url: string, options: { activate?: boolean } = {}): Promise<void> {
    const tab = createWorkspaceTabFromUrl(url)

    if (options.activate === false) {
      upsertTab(tab)
      persistTabs(tabs.value, activeUrl.value)
      return
    }

    await pushWorkspaceUrl(tab.url)
  }

  async function goBack(): Promise<void> {
    const targetSnapshot = backStack.value.at(-1)
    if (!targetSnapshot) return

    const previousBackStack = backStack.value
    const previousForwardStack = forwardStack.value
    backStack.value = backStack.value.slice(0, -1)
    forwardStack.value = appendNavigationSnapshot(forwardStack.value, currentNavigationSnapshot())
    pendingRestoreSnapshot = targetSnapshot

    try {
      await pushWorkspaceUrl(targetSnapshot.activeUrl, 'back')
    } catch (error) {
      backStack.value = previousBackStack
      forwardStack.value = previousForwardStack
      pendingRestoreSnapshot = null
      throw error
    }
  }

  async function goForward(): Promise<void> {
    const targetSnapshot = forwardStack.value.at(-1)
    if (!targetSnapshot) return

    const previousBackStack = backStack.value
    const previousForwardStack = forwardStack.value
    forwardStack.value = forwardStack.value.slice(0, -1)
    backStack.value = appendNavigationSnapshot(backStack.value, currentNavigationSnapshot())
    pendingRestoreSnapshot = targetSnapshot

    try {
      await pushWorkspaceUrl(targetSnapshot.activeUrl, 'forward')
    } catch (error) {
      backStack.value = previousBackStack
      forwardStack.value = previousForwardStack
      pendingRestoreSnapshot = null
      throw error
    }
  }

  async function closeTab(url: string): Promise<void> {
    if (tabs.value.length <= 1) return

    const index = tabs.value.findIndex((tab) => tab.url === url)
    if (index === -1) return

    const nextTabs = tabs.value.filter((tab) => tab.url !== url)
    tabs.value = nextTabs
    backStack.value = removeSnapshotTab(backStack.value, url)
    forwardStack.value = removeSnapshotTab(forwardStack.value, url)

    if (activeUrl.value === url) {
      const nextTab = nextTabs[Math.min(index, nextTabs.length - 1)] ?? nextTabs[0]
      activeUrl.value = nextTab.url
      persistTabs(tabs.value, activeUrl.value)
      await replaceWorkspaceUrl(nextTab.url)
      return
    }

    persistTabs(tabs.value, activeUrl.value)
  }

  async function closeOtherTabs(url: string): Promise<void> {
    if (tabs.value.length <= 1) return

    const target = tabs.value.find((tab) => tab.url === url)
    if (!target) return

    tabs.value = [target]
    backStack.value = []
    forwardStack.value = []

    if (activeUrl.value !== target.url) {
      activeUrl.value = target.url
      persistTabs(tabs.value, activeUrl.value)
      await replaceWorkspaceUrl(target.url)
      return
    }

    persistTabs(tabs.value, activeUrl.value)
  }

  async function closeTabsToRight(url: string): Promise<void> {
    const index = tabs.value.findIndex((tab) => tab.url === url)
    if (index === -1 || index >= tabs.value.length - 1) return

    const removedUrls = new Set(tabs.value.slice(index + 1).map((tab) => tab.url))
    tabs.value = tabs.value.slice(0, index + 1)
    backStack.value = []
    forwardStack.value = []

    if (removedUrls.has(activeUrl.value)) {
      activeUrl.value = url
      persistTabs(tabs.value, activeUrl.value)
      await replaceWorkspaceUrl(url)
      return
    }

    persistTabs(tabs.value, activeUrl.value)
  }

  async function closeAllTabs(): Promise<void> {
    const defaultTab = createWorkspaceTabFromUrl(DEFAULT_WORKSPACE_URL)

    tabs.value = [defaultTab]
    backStack.value = []
    forwardStack.value = []
    activeUrl.value = defaultTab.url
    persistTabs(tabs.value, activeUrl.value)
    await replaceWorkspaceUrl(defaultTab.url)
  }

  async function replaceActiveTabUrl(url: string): Promise<void> {
    const previousActiveUrl = activeUrl.value
    const nextTab = createWorkspaceTabFromUrl(url)

    if (nextTab.url === previousActiveUrl) return

    const previousTabs = tabs.value
    const previousBackStack = backStack.value
    const previousForwardStack = forwardStack.value

    tabs.value = replaceTabInCollection(tabs.value, previousActiveUrl, nextTab)
    activeUrl.value = nextTab.url
    backStack.value = replaceSnapshotTab(backStack.value, previousActiveUrl, nextTab)
    forwardStack.value = replaceSnapshotTab(forwardStack.value, previousActiveUrl, nextTab)
    persistTabs(tabs.value, activeUrl.value)

    try {
      await replaceWorkspaceUrl(nextTab.url)
    } catch (error) {
      tabs.value = previousTabs
      activeUrl.value = previousActiveUrl
      backStack.value = previousBackStack
      forwardStack.value = previousForwardStack
      persistTabs(tabs.value, activeUrl.value)
      throw error
    }
  }

  function applyRoute(nextRoute: RouteLocationNormalizedLoaded): void {
    if (nextRoute.name !== 'workspace' && nextRoute.name !== 'workspace-root') return
    const nextUrl = routeToWorkspaceUrl(nextRoute)

    if (nextUrl === '/') {
      void replaceWorkspaceUrl(activeUrl.value || DEFAULT_WORKSPACE_URL)
      return
    }

    const previousSnapshot = currentNavigationSnapshot()
    const restoreSnapshot = pendingRestoreSnapshot
    pendingRestoreSnapshot = null
    const tab = createWorkspaceTabFromUrl(nextUrl)

    if (restoreSnapshot) {
      restoreNavigationSnapshot(restoreSnapshot)
    } else {
      upsertTab(tab)
      activeUrl.value = tab.url
    }

    recordNavigation(previousSnapshot, currentNavigationSnapshot())
    persistTabs(tabs.value, activeUrl.value)

    if (tab.url !== nextUrl) {
      void replaceWorkspaceUrl(tab.url)
    }
  }

  async function pushWorkspaceUrl(url: string, intent: WorkspaceNavigationIntent = 'push'): Promise<void> {
    const nextUrl = createWorkspaceTabFromUrl(url).url
    if (nextUrl === activeUrl.value) {
      if (intent === 'back' || intent === 'forward') {
        const restoreSnapshot = pendingRestoreSnapshot
        pendingRestoreSnapshot = null

        if (restoreSnapshot && !sameNavigationSnapshot(currentNavigationSnapshot(), restoreSnapshot)) {
          restoreNavigationSnapshot(restoreSnapshot)
          persistTabs(tabs.value, activeUrl.value)
        }
      }

      return
    }

    navigationIntent = intent
    try {
      await router.push(nextUrl)
    } finally {
      if (navigationIntent === intent) {
        navigationIntent = null
      }
    }
  }

  async function replaceWorkspaceUrl(url: string): Promise<void> {
    const nextUrl = createWorkspaceTabFromUrl(url).url

    navigationIntent = 'replace'
    try {
      await router.replace(nextUrl)
    } finally {
      if (navigationIntent === 'replace') {
        navigationIntent = null
      }
    }
  }

  function recordNavigation(
    previousSnapshot: WorkspaceNavigationSnapshot,
    nextSnapshot: WorkspaceNavigationSnapshot,
  ): void {
    const intent = navigationIntent
    navigationIntent = null

    if (sameNavigationSnapshot(previousSnapshot, nextSnapshot)) return
    if (intent === 'replace' || intent === 'back' || intent === 'forward') return

    backStack.value = appendNavigationSnapshot(backStack.value, previousSnapshot)
    forwardStack.value = []
  }

  function currentNavigationSnapshot(): WorkspaceNavigationSnapshot {
    return {
      activeUrl: activeUrl.value,
      tabs: tabs.value,
    }
  }

  function restoreNavigationSnapshot(snapshot: WorkspaceNavigationSnapshot): void {
    const snapshotTabs = dedupeTabs(snapshot.tabs.map((tab) => createWorkspaceTabFromUrl(tab.url)))
    const activeSnapshotTab = snapshotTabs.find((tab) => tab.url === snapshot.activeUrl) ?? snapshotTabs[0]
    const nextTabs = activeSnapshotTab ? snapshotTabs : [createWorkspaceTabFromUrl(DEFAULT_WORKSPACE_URL)]

    tabs.value = nextTabs
    activeUrl.value = activeSnapshotTab?.url ?? nextTabs[0].url
  }

  function upsertTab(tab: WorkspaceTab): void {
    const existingIndex = findWorkspaceTabIndex(tabs.value, tab)
    if (existingIndex === -1) {
      tabs.value = [...tabs.value, tab]
      return
    }

    tabs.value = tabs.value.flatMap((item, index) => {
      if (index === existingIndex) return [tab]
      return isSameWorkspaceTab(item, tab) ? [] : [item]
    })
  }

  watch(
    () => route.fullPath,
    () => applyRoute(route),
    { immediate: true },
  )

  return {
    activeTab,
    activeUrl,
    canGoBack,
    canGoForward,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    goBack,
    goForward,
    openWorkspaceTab,
    replaceActiveTabUrl,
    selectTab,
    tabs,
  }
}

function readStoredTabs(): StoredWorkspaceTabs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.tabs)) {
      return null
    }

    const tabs = dedupeTabs(parsed.tabs.map(coerceStoredTab).filter((tab): tab is WorkspaceTab => Boolean(tab)))
    if (!tabs.length) return null

    const activeUrl = typeof parsed.activeUrl === 'string' ? createWorkspaceTabFromUrl(parsed.activeUrl).url : tabs[0].url
    const activeTab = tabs.find((tab) => tab.url === activeUrl) ?? tabs[0]

    return {
      version: STORAGE_VERSION,
      activeUrl: activeTab.url,
      tabs,
    }
  } catch {
    return null
  }
}

function coerceStoredTab(value: unknown): WorkspaceTab | null {
  if (!isRecord(value)) return null
  if (typeof value.url !== 'string') return null
  const storedType = normalizeLegacyStoredTabType(value.type)
  if (!storedType) return null

  const tab = createWorkspaceTabFromUrl(value.url)
  if (!isReservedInternalPath(tab.url) && tab.type !== storedType) return null

  return tab
}

function normalizeLegacyStoredTabType(value: unknown): WorkspaceTab['type'] | null {
  if (value === 'org') return 'account'
  if (typeof value !== 'string' || !isWorkspaceTabType(value)) return null

  return value
}

function persistTabs(tabs: WorkspaceTab[], activeUrl: string): void {
  const payload: StoredWorkspaceTabs = {
    version: STORAGE_VERSION,
    activeUrl,
    tabs: dedupeTabs(tabs),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function dedupeTabs(tabs: WorkspaceTab[]): WorkspaceTab[] {
  const seen = new Set<string>()
  const result: WorkspaceTab[] = []

  for (const tab of tabs) {
    if (seen.has(tab.url)) continue
    seen.add(tab.url)
    result.push(tab)
  }

  return result
}

function appendNavigationSnapshot(
  stack: WorkspaceNavigationSnapshot[],
  snapshot: WorkspaceNavigationSnapshot,
): WorkspaceNavigationSnapshot[] {
  if (!snapshot.activeUrl || !snapshot.tabs.length || sameNavigationSnapshot(stack.at(-1), snapshot)) {
    return stack
  }

  return [...stack, cloneNavigationSnapshot(snapshot)].slice(-MAX_NAVIGATION_STACK_SIZE)
}

function removeSnapshotTab(
  stack: WorkspaceNavigationSnapshot[],
  url: string,
): WorkspaceNavigationSnapshot[] {
  return stack
    .filter((snapshot) => snapshot.activeUrl !== url)
    .map((snapshot) => ({
      activeUrl: snapshot.activeUrl,
      tabs: snapshot.tabs.filter((tab) => tab.url !== url),
    }))
    .filter((snapshot) => snapshot.tabs.length > 0)
}

function replaceSnapshotTab(
  stack: WorkspaceNavigationSnapshot[],
  previousUrl: string,
  nextTab: WorkspaceTab,
): WorkspaceNavigationSnapshot[] {
  return stack
    .map((snapshot) => {
      const activeSnapshotTab = createWorkspaceTabFromUrl(snapshot.activeUrl)
      return {
        activeUrl: snapshot.activeUrl === previousUrl || isSameWorkspaceTab(activeSnapshotTab, nextTab)
          ? nextTab.url
          : snapshot.activeUrl,
        tabs: replaceTabInCollection(snapshot.tabs, previousUrl, nextTab),
      }
    })
    .filter((snapshot) => snapshot.tabs.length > 0)
}

function replaceTabInCollection(
  tabs: WorkspaceTab[],
  previousUrl: string,
  nextTab: WorkspaceTab,
): WorkspaceTab[] {
  const previousIndex = tabs.findIndex((tab) => tab.url === previousUrl)
  const existingIndex = findWorkspaceTabIndex(tabs, nextTab)
  const targetIndex = previousIndex === -1 ? existingIndex : previousIndex

  if (targetIndex === -1) {
    return [...tabs, nextTab]
  }

  return tabs.flatMap((tab, index) => {
    if (index === targetIndex) return [nextTab]
    return isSameWorkspaceTab(tab, nextTab) ? [] : [tab]
  })
}

function findWorkspaceTabIndex(tabs: WorkspaceTab[], tab: WorkspaceTab): number {
  const exactIndex = tabs.findIndex((item) => item.url === tab.url)
  if (exactIndex !== -1) return exactIndex

  return tabs.findIndex((item) => isSameWorkspaceTab(item, tab))
}

function isSameWorkspaceTab(left: WorkspaceTab, right: WorkspaceTab): boolean {
  if (left.url === right.url) return true
  if (left.type !== right.type) return false

  if (left.type === 'repo') {
    return left.owner === right.owner && left.repo === right.repo
  }

  return false
}

function sameNavigationSnapshot(
  left: WorkspaceNavigationSnapshot | undefined,
  right: WorkspaceNavigationSnapshot | undefined,
): boolean {
  if (!left || !right) return false
  if (left.activeUrl !== right.activeUrl) return false
  if (left.tabs.length !== right.tabs.length) return false

  return left.tabs.every((tab, index) => tab.url === right.tabs[index]?.url)
}

function cloneNavigationSnapshot(snapshot: WorkspaceNavigationSnapshot): WorkspaceNavigationSnapshot {
  return {
    activeUrl: snapshot.activeUrl,
    tabs: snapshot.tabs.map((tab) => ({ ...tab })),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

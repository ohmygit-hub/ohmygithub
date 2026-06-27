import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { WorkspaceTab, WorkspaceTabType } from '../types'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'oh-my-github:workspace-tabs:v1'
const STORAGE_VERSION = 1
const DEFAULT_URL = '/inbox'
const INTERNAL_TYPES = new Set<WorkspaceTabType>(['inbox', 'reviews', 'activity'])
const VALID_TYPES = new Set<WorkspaceTabType>([
  'inbox',
  'reviews',
  'activity',
  'draft',
  'account',
  'org',
  'repo',
])

interface StoredWorkspaceTabs {
  version: 1
  activeUrl: string
  tabs: WorkspaceTab[]
}

export function useWorkspaceTabs() {
  const route = useRoute()
  const router = useRouter()
  const restored = readStoredTabs()
  const tabs = ref<WorkspaceTab[]>(restored?.tabs ?? [createTabFromUrl(DEFAULT_URL)])
  const activeUrl = ref(restored?.activeUrl ?? tabs.value[0]?.url ?? DEFAULT_URL)

  const activeTab = computed(() => {
    return tabs.value.find((tab) => tab.url === activeUrl.value) ?? tabs.value[0]
  })

  async function selectTab(url: string): Promise<void> {
    await router.push(url)
  }

  async function createTab(): Promise<void> {
    const url = nextDraftUrl(tabs.value)
    await router.push(url)
  }

  async function closeTab(url: string): Promise<void> {
    if (tabs.value.length <= 1) return

    const index = tabs.value.findIndex((tab) => tab.url === url)
    if (index === -1) return

    const nextTabs = tabs.value.filter((tab) => tab.url !== url)
    tabs.value = nextTabs

    if (activeUrl.value === url) {
      const nextTab = nextTabs[Math.min(index, nextTabs.length - 1)] ?? nextTabs[0]
      activeUrl.value = nextTab.url
      persistTabs(tabs.value, activeUrl.value)
      await router.replace(nextTab.url)
      return
    }

    persistTabs(tabs.value, activeUrl.value)
  }

  function applyRoute(nextRoute: RouteLocationNormalizedLoaded): void {
    if (nextRoute.name !== 'workspace' && nextRoute.name !== 'workspace-root') return
    const nextUrl = routeToWorkspaceUrl(nextRoute)

    if (nextUrl === '/') {
      void router.replace(activeUrl.value || DEFAULT_URL)
      return
    }

    const tab = createTabFromUrl(nextUrl)
    upsertTab(tab)
    activeUrl.value = tab.url
    persistTabs(tabs.value, activeUrl.value)

    if (tab.url !== nextUrl) {
      void router.replace(tab.url)
    }
  }

  function upsertTab(tab: WorkspaceTab): void {
    const existingIndex = tabs.value.findIndex((item) => item.url === tab.url)
    if (existingIndex === -1) {
      tabs.value = [...tabs.value, tab]
      return
    }

    tabs.value = tabs.value.map((item, index) => index === existingIndex ? tab : item)
  }

  watch(
    () => route.fullPath,
    () => applyRoute(route),
    { immediate: true },
  )

  return {
    activeTab,
    activeUrl,
    closeTab,
    createTab,
    selectTab,
    tabs,
  }
}

function routeToWorkspaceUrl(route: RouteLocationNormalizedLoaded): string {
  const path = normalizePath(route.path)
  if (path === '/') return path

  const type = typeof route.query.type === 'string' ? route.query.type : ''
  if (!type || isReservedInternalPath(path)) return path
  if (!VALID_TYPES.has(type as WorkspaceTabType)) return path

  return `${path}?type=${encodeURIComponent(type)}`
}

function createTabFromUrl(url: string): WorkspaceTab {
  const parsed = parseWorkspaceUrl(url)
  return {
    ...parsed,
    title: titleForTab(parsed),
  }
}

function parseWorkspaceUrl(url: string): Omit<WorkspaceTab, 'title'> {
  const normalizedUrl = normalizeUrl(url)
  const [rawPath, rawSearch = ''] = normalizedUrl.split('?')
  const path = normalizePath(rawPath)
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent)
  const query = new URLSearchParams(rawSearch)
  const queryType = query.get('type')

  if (segments.length === 0) {
    return { url: DEFAULT_URL, type: 'inbox' }
  }

  const firstSegment = segments[0]

  if (firstSegment === 'draft') {
    const draftId = sanitizeSegment(segments[1]) || '1'
    return {
      url: `/draft/${draftId}`,
      type: 'draft',
      draftId,
    }
  }

  if (INTERNAL_TYPES.has(firstSegment as WorkspaceTabType)) {
    return {
      url: `/${firstSegment}`,
      type: firstSegment as WorkspaceTabType,
    }
  }

  const owner = sanitizeSegment(firstSegment)
  const repo = sanitizeSegment(segments[1])

  if (owner && repo) {
    return {
      url: `/${owner}/${repo}`,
      type: 'repo',
      owner,
      repo,
    }
  }

  const ownerType = queryType === 'org' ? 'org' : 'account'

  return {
    url: ownerType === 'org' ? `/${owner}?type=org` : `/${owner}`,
    type: ownerType,
    owner,
  }
}

function titleForTab(tab: Omit<WorkspaceTab, 'title'>): string {
  if (tab.type === 'inbox') return 'Inbox'
  if (tab.type === 'reviews') return 'Review Queue'
  if (tab.type === 'activity') return 'Activity'
  if (tab.type === 'draft') return `Draft ${tab.draftId ?? '1'}`
  if (tab.type === 'repo') return `${tab.owner}/${tab.repo}`
  if (tab.type === 'org') return tab.owner ?? 'Organization'
  return tab.owner ?? 'Account'
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

    const activeUrl = typeof parsed.activeUrl === 'string' ? createTabFromUrl(parsed.activeUrl).url : tabs[0].url
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
  if (typeof value.type !== 'string' || !VALID_TYPES.has(value.type as WorkspaceTabType)) return null

  const tab = createTabFromUrl(value.url)
  if (!isReservedInternalPath(tab.url) && tab.type !== value.type) return null

  return tab
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

function nextDraftUrl(tabs: WorkspaceTab[]): string {
  let next = 1
  const used = new Set(
    tabs
      .map((tab) => tab.draftId)
      .filter((id): id is string => Boolean(id)),
  )

  while (used.has(String(next))) {
    next += 1
  }

  return `/draft/${next}`
}

function normalizeUrl(url: string): string {
  const [rawPath, rawSearch = ''] = url.split('?')
  const path = normalizePath(rawPath)
  const search = new URLSearchParams(rawSearch)
  const type = search.get('type')

  if (type !== 'org' || isReservedInternalPath(path)) {
    return path
  }

  return `${path}?type=org`
}

function normalizePath(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const trimmed = cleanPath.replace(/\/+/g, '/').replace(/\/$/, '')
  return trimmed || '/'
}

function isReservedInternalPath(path: string): boolean {
  const [firstSegment] = normalizePath(path).split('/').filter(Boolean)
  return firstSegment === 'draft' || INTERNAL_TYPES.has(firstSegment as WorkspaceTabType)
}

function sanitizeSegment(value: string | undefined): string {
  return String(value ?? '').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

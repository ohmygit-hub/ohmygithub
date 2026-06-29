import type { WorkspaceBookmark, WorkspaceBookmarkFolder, WorkspaceTab } from '../types'
import { computed, ref } from 'vue'
import { createWorkspaceTabFromUrl, isWorkspaceTabType, normalizeWorkspaceUrl } from '../workspace-url'

export const BOOKMARK_ROOT_LIST_ID = 'bookmarks-root'
export const BOOKMARK_ITEM_ID_PREFIX = 'bookmark:'
export const BOOKMARK_FOLDER_LIST_PREFIX = 'bookmark-folder:'

const LEGACY_STORAGE_KEY = 'oh-my-github:workspace-bookmarks:v1'
const STORAGE_VERSION = 1

export type BookmarkMutationResult =
  | { ok: true }
  | { ok: false; reason: 'duplicate' | 'empty' | 'not-found' }

export type CreateBookmarkFolderResult =
  | { ok: true; folder: WorkspaceBookmarkFolder }
  | { ok: false; reason: 'duplicate' | 'empty' }

export interface ReorderBookmarkListInput {
  listId: string
  itemIds: string[]
}

interface StoredWorkspaceBookmarks {
  version: 1
  folders: WorkspaceBookmarkFolder[]
  bookmarks: WorkspaceBookmark[]
}

export function useWorkspaceBookmarks() {
  const folders = ref<WorkspaceBookmarkFolder[]>([])
  const bookmarks = ref<WorkspaceBookmark[]>([])
  const isRestored = ref(false)
  let hasLocalChanges = false

  void restoreBookmarks()

  const bookmarkByUrl = computed(() => {
    return new Map(bookmarks.value.map((bookmark) => [bookmark.url, bookmark]))
  })

  const bookmarkedUrls = computed(() => new Set(bookmarkByUrl.value.keys()))

  function createFolder(title: string): CreateBookmarkFolderResult {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      return { ok: false, reason: 'empty' }
    }

    if (hasFolderTitle(normalizedTitle)) {
      return { ok: false, reason: 'duplicate' }
    }

    const now = new Date().toISOString()
    const folder: WorkspaceBookmarkFolder = {
      id: createId('folder'),
      title: normalizedTitle,
      createdAt: now,
      updatedAt: now,
    }

    folders.value = [...folders.value, folder]
    persist()

    return { ok: true, folder }
  }

  function renameFolder(folderId: string, title: string): BookmarkMutationResult {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) return { ok: false, reason: 'empty' }
    if (hasFolderTitle(normalizedTitle, folderId)) return { ok: false, reason: 'duplicate' }

    const now = new Date().toISOString()
    let didRename = false
    folders.value = folders.value.map((folder) => {
      if (folder.id !== folderId) return folder
      didRename = true
      return {
        ...folder,
        title: normalizedTitle,
        updatedAt: now,
      }
    })

    if (!didRename) return { ok: false, reason: 'not-found' }

    persist()
    return { ok: true }
  }

  function removeFolder(folderId: string): void {
    if (!folders.value.some((folder) => folder.id === folderId)) return

    folders.value = folders.value.filter((folder) => folder.id !== folderId)
    bookmarks.value = bookmarks.value.map((bookmark) =>
      bookmark.folderId === folderId ? { ...bookmark, folderId: null } : bookmark
    )
    persist()
  }

  function addBookmark(input: {
    folderId: string | null
    organization?: GitHubOrganization
    tab: WorkspaceTab
    title: string
  }): void {
    const tab = createWorkspaceTabFromUrl(input.tab.url)
    const existing = bookmarkByUrl.value.get(tab.url)
    const folderId = validFolderId(input.folderId)

    const bookmark: WorkspaceBookmark = {
      id: existing?.id ?? createId('bookmark'),
      url: tab.url,
      type: tab.type,
      title: input.title.trim() || tab.title,
      folderId,
      owner: tab.owner,
      repo: tab.repo,
      draftId: tab.draftId,
      number: tab.number,
      accountSection: tab.accountSection,
      repositorySection: tab.repositorySection,
      pullRequestCategory: tab.pullRequestCategory,
      issueCategory: tab.issueCategory,
      searchMode: tab.searchMode,
      searchQuery: tab.searchQuery,
      notFoundInput: tab.notFoundInput,
      avatarUrl: input.organization?.avatarUrl ?? existing?.avatarUrl,
      avatarFallback: input.organization?.login.slice(0, 1).toUpperCase() ?? existing?.avatarFallback,
    }

    const nextBookmarks = bookmarks.value.filter((item) => item.url !== tab.url)
    bookmarks.value = [...nextBookmarks, bookmark]
    persist()
  }

  function renameBookmark(bookmarkId: string, title: string): BookmarkMutationResult {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) return { ok: false, reason: 'empty' }

    let didRename = false
    bookmarks.value = bookmarks.value.map((bookmark) => {
      if (bookmark.id !== bookmarkId) return bookmark
      didRename = true
      return {
        ...bookmark,
        title: normalizedTitle,
      }
    })

    if (!didRename) return { ok: false, reason: 'not-found' }

    persist()
    return { ok: true }
  }

  function removeBookmark(url: string): void {
    const normalizedUrl = normalizeWorkspaceUrl(url)
    const nextBookmarks = bookmarks.value.filter((bookmark) => bookmark.url !== normalizedUrl)

    if (nextBookmarks.length === bookmarks.value.length) return

    bookmarks.value = nextBookmarks
    persist()
  }

  function removeBookmarkById(bookmarkId: string): void {
    const nextBookmarks = bookmarks.value.filter((bookmark) => bookmark.id !== bookmarkId)
    if (nextBookmarks.length === bookmarks.value.length) return

    bookmarks.value = nextBookmarks
    persist()
  }

  function moveBookmarkToFolder(bookmarkId: string, folderId: string | null): void {
    const nextFolderId = validFolderId(folderId)
    let didMove = false
    bookmarks.value = bookmarks.value.map((bookmark) => {
      if (bookmark.id !== bookmarkId || bookmark.folderId === nextFolderId) return bookmark
      didMove = true
      return {
        ...bookmark,
        folderId: nextFolderId,
      }
    })

    if (didMove) persist()
  }

  function reorderBookmarkList(input: ReorderBookmarkListInput): void {
    const targetFolderId = folderIdFromListId(input.listId)
    const bookmarkIds = input.itemIds.map(bookmarkIdFromItemId).filter((id): id is string => Boolean(id))
    const folderIds = input.itemIds.map(folderIdFromItemId).filter((id): id is string => Boolean(id))
    let didChange = false

    if (input.listId === BOOKMARK_ROOT_LIST_ID && folderIds.length > 0) {
      folders.value = reorderSubset(folders.value, folderIds)
      didChange = true
    }

    if (targetFolderId !== undefined && bookmarkIds.length > 0) {
      bookmarks.value = reorderBookmarksInFolder(bookmarks.value, targetFolderId, bookmarkIds)
      didChange = true
    }

    if (didChange) persist()
  }

  function getBookmark(url: string): WorkspaceBookmark | undefined {
    return bookmarkByUrl.value.get(normalizeWorkspaceUrl(url))
  }

  async function restoreBookmarks(): Promise<void> {
    try {
      const bookmarksBridge = window.ohMyGithub?.bookmarks
      const info = await bookmarksBridge?.get?.()
      const fileBookmarks = coerceStoredBookmarks(info?.bookmarks)

      if (info?.hasContent) {
        applyRestoredBookmarks(fileBookmarks)
        return
      }

      const legacyBookmarks = readLegacyStoredBookmarks()
      if (hasStoredBookmarksContent(legacyBookmarks)) {
        applyRestoredBookmarks(legacyBookmarks)
        if (bookmarksBridge) {
          await persistBookmarks(legacyBookmarks)
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        }
        return
      }

      applyRestoredBookmarks(fileBookmarks)
    } catch {
      applyRestoredBookmarks(readLegacyStoredBookmarks())
    } finally {
      isRestored.value = true
    }
  }

  function applyRestoredBookmarks(restored: Pick<StoredWorkspaceBookmarks, 'bookmarks' | 'folders'>): void {
    if (hasLocalChanges) return

    folders.value = restored.folders
    bookmarks.value = restored.bookmarks
  }

  function persist(): void {
    hasLocalChanges = true
    void persistBookmarks({
      folders: folders.value,
      bookmarks: bookmarks.value,
    }).catch((error) => {
      console.error('Failed to persist workspace bookmarks', error)
    })
  }

  function hasFolderTitle(title: string, excludeFolderId?: string): boolean {
    return folders.value.some((folder) =>
      folder.id !== excludeFolderId && folder.title.toLowerCase() === title.toLowerCase()
    )
  }

  function validFolderId(folderId: string | null): string | null {
    return folderId && folders.value.some((folder) => folder.id === folderId) ? folderId : null
  }

  return {
    bookmarkedUrls,
    bookmarkByUrl,
    bookmarks,
    createFolder,
    folders,
    getBookmark,
    isRestored,
    moveBookmarkToFolder,
    removeBookmark,
    removeBookmarkById,
    removeFolder,
    renameBookmark,
    renameFolder,
    reorderBookmarkList,
    addBookmark,
  }
}

async function persistBookmarks(payload: Pick<StoredWorkspaceBookmarks, 'bookmarks' | 'folders'>): Promise<void> {
  const stored: StoredWorkspaceBookmarks = {
    version: STORAGE_VERSION,
    folders: payload.folders,
    bookmarks: dedupeBookmarks(payload.bookmarks),
  }

  await window.ohMyGithub?.bookmarks?.update?.(stored)
}

function readLegacyStoredBookmarks(): Pick<StoredWorkspaceBookmarks, 'bookmarks' | 'folders'> {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      return { folders: [], bookmarks: [] }
    }

    return coerceStoredBookmarks(JSON.parse(raw) as unknown)
  } catch {
    return { folders: [], bookmarks: [] }
  }
}

function coerceStoredBookmarks(value: unknown): Pick<StoredWorkspaceBookmarks, 'bookmarks' | 'folders'> {
  if (!isRecord(value) || value.version !== STORAGE_VERSION) {
    return { folders: [], bookmarks: [] }
  }

  const folders = Array.isArray(value.folders)
    ? value.folders.map(coerceStoredFolder).filter((folder): folder is WorkspaceBookmarkFolder => Boolean(folder))
    : []
  const folderIds = new Set(folders.map((folder) => folder.id))
  const bookmarks = Array.isArray(value.bookmarks)
    ? dedupeBookmarks(
      value.bookmarks
        .map((bookmark) => coerceStoredBookmark(bookmark, folderIds))
        .filter((bookmark): bookmark is WorkspaceBookmark => Boolean(bookmark)),
    )
    : []

  return { folders, bookmarks }
}

function coerceStoredFolder(value: unknown): WorkspaceBookmarkFolder | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null

  const title = value.title.trim()
  if (!title) return null

  return {
    id: value.id,
    title,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  }
}

function coerceStoredBookmark(value: unknown, folderIds: Set<string>): WorkspaceBookmark | null {
  if (!isRecord(value)) return null
  if (typeof value.url !== 'string') return null
  if (typeof value.type !== 'string' || !isWorkspaceTabType(value.type)) return null
  if (typeof value.title !== 'string') return null

  const tab = createWorkspaceTabFromUrl(value.url)
  if (tab.type !== value.type) return null

  const folderId = typeof value.folderId === 'string' && folderIds.has(value.folderId)
    ? value.folderId
    : null

  return {
    id: typeof value.id === 'string' ? value.id : createId('bookmark'),
    url: tab.url,
    type: tab.type,
    title: value.title.trim() || tab.title,
    folderId,
    owner: tab.owner,
    repo: tab.repo,
    draftId: tab.draftId,
    number: tab.number,
    accountSection: tab.accountSection,
    repositorySection: tab.repositorySection,
    pullRequestCategory: tab.pullRequestCategory,
    issueCategory: tab.issueCategory,
    searchMode: tab.searchMode,
    searchQuery: tab.searchQuery,
    notFoundInput: tab.notFoundInput,
    avatarUrl: typeof value.avatarUrl === 'string' ? value.avatarUrl : undefined,
    avatarFallback: typeof value.avatarFallback === 'string' ? value.avatarFallback : undefined,
  }
}

function reorderBookmarksInFolder(
  currentBookmarks: WorkspaceBookmark[],
  folderId: string | null,
  orderedBookmarkIds: string[],
): WorkspaceBookmark[] {
  const orderedSet = new Set(orderedBookmarkIds)
  const updatedBookmarks = currentBookmarks.map((bookmark) =>
    orderedSet.has(bookmark.id) ? { ...bookmark, folderId } : bookmark
  )
  const bookmarksById = new Map(updatedBookmarks.map((bookmark) => [bookmark.id, bookmark]))
  const existingTargetIds = updatedBookmarks
    .filter((bookmark) => bookmark.folderId === folderId)
    .map((bookmark) => bookmark.id)
  const nextTargetIds = [
    ...orderedBookmarkIds,
    ...existingTargetIds.filter((id) => !orderedSet.has(id)),
  ]
  const orderedTargetBookmarks = nextTargetIds
    .map((id) => bookmarksById.get(id))
    .filter((bookmark): bookmark is WorkspaceBookmark => Boolean(bookmark))

  return mergeBookmarkGroup(updatedBookmarks, folderId, orderedTargetBookmarks)
}

function mergeBookmarkGroup(
  bookmarks: WorkspaceBookmark[],
  folderId: string | null,
  orderedTargetBookmarks: WorkspaceBookmark[],
): WorkspaceBookmark[] {
  const targetIds = new Set(orderedTargetBookmarks.map((bookmark) => bookmark.id))
  const result: WorkspaceBookmark[] = []
  let didInsertTargetGroup = false

  for (const bookmark of bookmarks) {
    if (bookmark.folderId === folderId || targetIds.has(bookmark.id)) {
      if (!didInsertTargetGroup) {
        result.push(...orderedTargetBookmarks)
        didInsertTargetGroup = true
      }
      continue
    }

    result.push(bookmark)
  }

  if (!didInsertTargetGroup) {
    result.push(...orderedTargetBookmarks)
  }

  return dedupeBookmarks(result)
}

function reorderSubset<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const orderedSet = new Set(orderedIds)
  const byId = new Map(items.map((item) => [item.id, item]))
  const orderedItems = orderedIds.map((id) => byId.get(id)).filter((item): item is T => Boolean(item))
  const result: T[] = []
  let didInsertOrderedItems = false

  for (const item of items) {
    if (orderedSet.has(item.id)) {
      if (!didInsertOrderedItems) {
        result.push(...orderedItems)
        didInsertOrderedItems = true
      }
      continue
    }

    result.push(item)
  }

  if (!didInsertOrderedItems) {
    result.push(...orderedItems)
  }

  return result
}

function bookmarkIdFromItemId(itemId: string): string | null {
  return itemId.startsWith(BOOKMARK_ITEM_ID_PREFIX) ? itemId.slice(BOOKMARK_ITEM_ID_PREFIX.length) : null
}

function folderIdFromItemId(itemId: string): string | null {
  return itemId.startsWith(BOOKMARK_FOLDER_LIST_PREFIX) ? itemId.slice(BOOKMARK_FOLDER_LIST_PREFIX.length) : null
}

function folderIdFromListId(listId: string): string | null | undefined {
  if (listId === BOOKMARK_ROOT_LIST_ID) return null
  if (listId.startsWith(BOOKMARK_FOLDER_LIST_PREFIX)) {
    return listId.slice(BOOKMARK_FOLDER_LIST_PREFIX.length)
  }

  return undefined
}

function hasStoredBookmarksContent(payload: Pick<StoredWorkspaceBookmarks, 'bookmarks' | 'folders'>): boolean {
  return payload.folders.length > 0 || payload.bookmarks.length > 0
}

function dedupeBookmarks(bookmarks: WorkspaceBookmark[]): WorkspaceBookmark[] {
  const seen = new Set<string>()
  const result: WorkspaceBookmark[] = []

  for (const bookmark of bookmarks) {
    if (seen.has(bookmark.url)) continue
    seen.add(bookmark.url)
    result.push(bookmark)
  }

  return result
}

function createId(prefix: string): string {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`
  }

  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

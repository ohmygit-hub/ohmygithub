import { watch, type FSWatcher } from 'node:fs'
import { join, resolve } from 'node:path'
import { Menu, nativeImage, Tray } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { GitHubNotification } from '@oh-my-github/api'
import { bookmarksFilePath, type StoredWorkspaceBookmarks } from './bookmarks'
import { getTrayLabels, type TrayLanguage } from './tray-labels'
import { buildTrayMenuTemplate, TRAY_NOTIFICATION_LIMIT, type TrayMenuHandlers } from './tray-menu'

export interface AppTrayDeps {
  showWindow: () => void
  sendToRenderer: (channel: string, payload?: unknown) => void
  getLanguage: () => TrayLanguage
  isAuthenticated: () => boolean
  listBookmarks: () => StoredWorkspaceBookmarks
  listNotifications: (limit: number) => Promise<GitHubNotification[]>
  onAuthChanged: (listener: () => void) => () => void
  quit: () => void
}

export interface AppTrayHandle {
  refresh: () => void
  refreshInbox: () => void
  destroy: () => void
}

const INBOX_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const BOOKMARKS_DEBOUNCE_MS = 200

function resolveTrayIcon(): Electron.NativeImage {
  const dir = is.dev ? resolve(__dirname, '../../resources/tray') : join(process.resourcesPath, 'tray')
  const file = process.platform === 'darwin' ? 'trayTemplate.png' : 'tray.png'
  const icon = nativeImage.createFromPath(join(dir, file))
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }
  return icon
}

export function createAppTray(deps: AppTrayDeps): AppTrayHandle {
  const tray = new Tray(resolveTrayIcon())
  tray.setToolTip('Oh My GitHub')

  // Double-clicking the tray icon restores/focuses the window (creating it if the app
  // was closed to tray). Right-click still opens the context menu.
  tray.on('double-click', () => deps.showWindow())

  let notifications: GitHubNotification[] = []

  const handlers: TrayMenuHandlers = {
    openWindow: () => deps.showWindow(),
    openSearch: () => deps.sendToRenderer('tray:open-search'),
    navigateBookmark: (url) => deps.sendToRenderer('tray:navigate', url),
    openNotification: (notification) =>
      deps.sendToRenderer('tray:open-notification', {
        repositoryFullName: notification.repositoryFullName,
        number: notification.number,
        subjectType: notification.subjectType,
        htmlUrl: notification.htmlUrl
      }),
    quit: () => deps.quit()
  }

  function rebuild(): void {
    const { folders, bookmarks } = deps.listBookmarks()
    const template = buildTrayMenuTemplate(
      { folders, bookmarks, notifications, isAuthenticated: deps.isAuthenticated() },
      handlers,
      getTrayLabels(deps.getLanguage())
    )
    tray.setContextMenu(Menu.buildFromTemplate(template))
  }

  async function refreshInbox(): Promise<void> {
    notifications = await deps.listNotifications(TRAY_NOTIFICATION_LIMIT)
    rebuild()
  }

  // Initial render, then fetch the inbox in the background.
  rebuild()
  void refreshInbox()

  // Triggers.
  const interval = setInterval(() => void refreshInbox(), INBOX_REFRESH_INTERVAL_MS)
  const unsubscribeAuth = deps.onAuthChanged(() => void refreshInbox())

  let debounce: ReturnType<typeof setTimeout> | null = null
  let watcher: FSWatcher | null = null
  try {
    watcher = watch(bookmarksFilePath, () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => rebuild(), BOOKMARKS_DEBOUNCE_MS)
    })
  } catch {
    // Bookmarks file may not exist yet; rebuild() reads it lazily on other triggers.
  }

  return {
    refresh: () => rebuild(),
    refreshInbox: () => void refreshInbox(),
    destroy: () => {
      clearInterval(interval)
      unsubscribeAuth()
      if (debounce) clearTimeout(debounce)
      watcher?.close()
      tray.destroy()
    }
  }
}

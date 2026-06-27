import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { initializeAuth, registerAuthIpc } from './auth'
import { initializeConfig, registerConfigIpc } from './config'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    title: 'Oh My GitHub',
    backgroundColor: '#f7f7f5',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  function sendFullscreenState(): void {
    if (mainWindow.isDestroyed()) return
    mainWindow.webContents.send('window:fullscreen-change', {
      isFullScreen: mainWindow.isFullScreen()
    })
  }

  mainWindow.on('enter-full-screen', sendFullscreenState)
  mainWindow.on('leave-full-screen', sendFullscreenState)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowIpc(): void {
  ipcMain.handle('window:get-state', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    return {
      isFullScreen: window?.isFullScreen() ?? false
    }
  })
}

void app.whenReady().then(() => {
  app.setAppUserModelId('dev.oh-my-github.client')
  registerAuthIpc()
  registerConfigIpc()
  registerWindowIpc()
  initializeAuth()
  initializeConfig()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

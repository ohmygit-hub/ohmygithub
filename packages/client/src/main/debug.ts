import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

const CDP_PORT_ENV = 'OH_MY_GITHUB_CDP_PORT'
const CDP_ADDRESS = '127.0.0.1'

function readCdpPort(): string | null {
  const rawPort = process.env[CDP_PORT_ENV]?.trim()

  if (!rawPort) {
    return null
  }

  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.warn(`[debug] Ignoring invalid ${CDP_PORT_ENV} value: ${rawPort}`)
    return null
  }

  return rawPort
}

export function configureDevRemoteDebugging(): void {
  if (!is.dev) {
    return
  }

  const port = readCdpPort()

  if (!port) {
    return
  }

  app.commandLine.appendSwitch('remote-debugging-address', CDP_ADDRESS)
  app.commandLine.appendSwitch('remote-debugging-port', port)
  console.info(`[debug] Chromium DevTools Protocol listening at http://${CDP_ADDRESS}:${port}`)
}

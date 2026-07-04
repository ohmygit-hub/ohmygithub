// Runs electron-builder (or any command) with the monorepo-root .env loaded and a few
// build conventions applied. Used by the `package*` scripts.
//
//   node scripts/with-env.mjs electron-builder --mac
//
// Behavior:
//   - Loads the monorepo-root `.env` and fills env GAPS only: anything already present in
//     process.env (CI / GitHub Actions Variables and Secrets) takes precedence.
//   - Accepts either electron-builder's `CSC_LINK` + `CSC_KEY_PASSWORD` names or the
//     common `APPLE_CERTIFICATE` + `APPLE_CERTIFICATE_PASSWORD` aliases.
//   - Without a signing certificate (`CSC_LINK`), disables identity auto-discovery so macOS
//     builds stay unsigned and never prompt for a keychain identity (matches the previous
//     `mac.identity: null` behavior).
//   - With signing credentials and App Store Connect API credentials, enables notarization
//     for macOS builds. Unsigned local / PR builds stay unsigned and skip notarization.
//   - With `R2_PUBLIC_BASE_URL` set, injects a generic publish provider so electron-builder
//     emits the update manifest (latest*.yml) and bakes app-update.yml pointing at R2.
//     `-p never` keeps it local: generic providers are never network-published, so the files
//     are only generated — the publish workflow uploads them to R2 for in-app updates.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '../../../.env')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const body = line.startsWith('export ') ? line.slice('export '.length).trim() : line
    const eq = body.indexOf('=') // split on first `=` so base64 / `=`-containing values survive
    if (eq === -1) continue
    const key = body.slice(0, eq).trim()
    if (!key || key in process.env) continue // existing env wins
    let value = body.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnvFile(envPath)

if (!process.env.CSC_LINK && process.env.APPLE_CERTIFICATE) {
  process.env.CSC_LINK = process.env.APPLE_CERTIFICATE
}
if (!process.env.CSC_KEY_PASSWORD && process.env.APPLE_CERTIFICATE_PASSWORD) {
  process.env.CSC_KEY_PASSWORD = process.env.APPLE_CERTIFICATE_PASSWORD
}
if (process.env.APPLE_API_KEY && !existsSync(process.env.APPLE_API_KEY)) {
  const keyBody = process.env.APPLE_API_KEY.includes('BEGIN PRIVATE KEY')
    ? process.env.APPLE_API_KEY
    : Buffer.from(process.env.APPLE_API_KEY, 'base64').toString('utf8')
  const keyPath = resolve(tmpdir(), `oh-my-github-${process.env.APPLE_API_KEY_ID ?? 'apple-api-key'}.p8`)
  writeFileSync(keyPath, keyBody, { mode: 0o600 })
  process.env.APPLE_API_KEY = keyPath
}

const [command, ...args] = process.argv.slice(2)
if (!command) {
  console.error('with-env: no command provided')
  process.exit(1)
}

// Keep macOS builds unsigned (no keychain prompt) unless a signing cert is supplied.
if (!process.env.CSC_LINK) {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
}

// Generate the update manifest (latest*.yml) + app-update.yml when an R2 feed URL is set.
// `-p never` => files are generated locally, never network-published.
const extraArgs = []
if (process.env.R2_PUBLIC_BASE_URL) {
  extraArgs.push(
    '-c.publish.provider=generic',
    `-c.publish.url=${process.env.R2_PUBLIC_BASE_URL}`,
    '-p',
    'never'
  )
}

// Override the app/bundle id when APP_ID is set; otherwise electron-builder.yml's default is used.
if (process.env.APP_ID) {
  extraArgs.push(`-c.appId=${process.env.APP_ID}`)
}

const hasSigningCert = Boolean(process.env.CSC_LINK && process.env.CSC_KEY_PASSWORD)
const hasAppleApiNotarization = Boolean(
  process.env.APPLE_API_KEY &&
  process.env.APPLE_API_KEY_ID &&
  process.env.APPLE_API_ISSUER &&
  process.env.APPLE_TEAM_ID
)

if (hasSigningCert && hasAppleApiNotarization) {
  extraArgs.push('-c.mac.notarize=true')
}

const result = spawnSync(command, [...args, ...extraArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

if (result.error) {
  console.error('with-env:', result.error.message)
  process.exit(1)
}
process.exit(result.status ?? 1)

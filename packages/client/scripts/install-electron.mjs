#!/usr/bin/env node
// Download the Electron binary reliably.
//
// Why this wrapper exists:
//   - Electron 42 ships no `postinstall` script, so `pnpm install` never fetches
//     the ~350MB binary; it must be downloaded in a separate step.
//   - `@electron/get` reads the download mirror from env vars, but `pnpm exec`
//     (and some CI shells) do NOT propagate the `electron_mirror` key from
//     `.npmrc` into the child process env. The download then falls back to
//     GitHub Releases, which is blocked/slow in many regions and, worse, is
//     cached under a *different* URL hash than the mirror — so a previously
//     downloaded zip is not reused and the install re-fetches (and fails).
//
// Setting ELECTRON_MIRROR explicitly here guarantees the same reachable URL is
// used everywhere, so the @electron/get cache is reused and the download is
// offline after the first success.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Keep this in sync with `.npmrc` (electron_mirror). `||=` lets callers override.
process.env.ELECTRON_MIRROR ||= 'https://npmmirror.com/mirrors/electron/'
process.env.ELECTRON_NIGHTLY_MIRROR ||= 'https://npmmirror.com/mirrors/electron-nightly/'

// Resolve Electron's own installer from the client package's dependency tree.
const installer = require.resolve('electron/install.js')

const result = spawnSync(process.execPath, [installer], { stdio: 'inherit' })
process.exit(result.status ?? 1)

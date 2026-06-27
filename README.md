# Oh My GitHub

Oh My GitHub is an Electron desktop workspace for GitHub notifications, pull requests, issues, and actions.

This first scaffold focuses on a fast Notion-like app shell with mock GitHub data. Real OAuth, API sync, and local persistence are intentionally left as follow-up layers.

## Stack

- TypeScript
- Vue 3
- Vite
- Electron
- electron-vite
- Reka UI
- pnpm workspaces

## Packages

- `packages/ui` - shared Vue UI primitives built around Reka UI and app theme styles.
- `packages/api` - GitHub API contracts plus a mock client.
- `packages/client` - Electron main, preload, and Vue renderer app.

## Scripts

```sh
pnpm run env:setup
pnpm dev
pnpm typecheck
pnpm build
```

`pnpm run env:setup` installs workspace dependencies and explicitly downloads the Electron binary. The
project pins `electron_mirror` in `.npmrc` so Electron installs reliably in local development.

## Network Proxy

GitHub requests use this proxy priority:

1. `~/.oh-my-github/config.json` `network.proxyUrl`
2. `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` environment variables
3. The operating system proxy resolved by Electron

Example local config:

```json
{
  "schemaVersion": 1,
  "github": {
    "activeAccountLogin": null
  },
  "network": {
    "proxyUrl": "http://127.0.0.1:7890"
  },
  "ui": {
    "locale": "en",
    "theme": "auto"
  }
}
```

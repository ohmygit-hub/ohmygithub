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
pnpm package
pnpm package:mac
pnpm package:win
```

`pnpm run env:setup` installs workspace dependencies and explicitly downloads the Electron binary. The
project pins `electron_mirror` in `.npmrc` so Electron installs reliably in local development.

`pnpm package` builds an installable Electron package with `electron-builder`. Platform-specific
installers are available through `pnpm package:mac` for `.dmg`/`.zip` and `pnpm package:win` for a
Windows NSIS `.exe` installer. Release artifacts are written under `packages/client/release/`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for environment variables, the CI/CD workflows, how to
cut a release, and code-signing setup.

## Developer Debugging

The Electron renderer can expose a local Chrome DevTools Protocol endpoint in development builds.
Set `OH_MY_GITHUB_CDP_PORT` before starting the app:

```powershell
$env:OH_MY_GITHUB_CDP_PORT = '9222'
pnpm dev
```

The endpoint binds to `127.0.0.1` only and is disabled unless the environment variable is set.
You can confirm it is available with:

```powershell
Invoke-RestMethod http://127.0.0.1:9222/json/version
```

For `chrome-devtools-mcp`, connect to this Electron endpoint with `--browserUrl`:

```toml
[mcp_servers.chrome-devtools]
command = "npx"
args = ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
```

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

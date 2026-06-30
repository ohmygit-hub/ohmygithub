# Contributing

## Prerequisites

- **Node** `^20.19.0 || >=22.12.0`
- **pnpm** `11.7.0` (pinned via `packageManager`; `corepack enable` will provision it)

```sh
pnpm run env:setup   # install deps + download the Electron runtime (uses the .npmrc mirror)
```

## Common commands

```sh
pnpm dev             # run the Electron app in development
pnpm -r typecheck    # typecheck every package (also aliased as `pnpm lint`)
pnpm -r test         # run vitest across packages (api + client)
pnpm build           # build all packages
pnpm package         # build installers for the current OS (electron-builder)
pnpm package:mac     # .dmg / .zip (arm64 + x64)
pnpm package:win     # Windows NSIS .exe (x64)
pnpm package:linux   # Linux AppImage (x64 + arm64)
```

Packaging runs through `packages/client/scripts/with-env.mjs`, which loads the monorepo-root
`.env` into the environment before invoking `electron-builder`. Values already present in the
environment (e.g. CI-provided ones) always win over `.env`.

## Environment variables

Copy `.env.example` to `.env` for local development. Only `GITHUB_CLIENT_ID` is required; the
rest are optional and used only for signed/published release builds.

| Variable | Required | Purpose | Local | GitHub Actions |
|---|---|---|---|---|
| `GITHUB_CLIENT_ID` | **yes** | GitHub OAuth App client id, baked into the app at build time | `.env` | **Variable** |
| `CSC_LINK` | no | Code-signing cert — `.p12` path or base64 string | `.env` | **Secret** |
| `CSC_KEY_PASSWORD` | no | Code-signing cert password | `.env` | **Secret** |
| `APPLE_ID` | no | Apple ID email (notarization) | `.env` | **Variable** |
| `APPLE_APP_SPECIFIC_PASSWORD` | no | Apple app-specific password (notarization) | `.env` | **Secret** |
| `APPLE_TEAM_ID` | no | Apple Developer Team ID (notarization) | `.env` | **Variable** |
| `R2_ACCOUNT_ID` | no | Cloudflare account id (R2 upload) | `.env` | **Variable** |
| `R2_BUCKET` | no | R2 bucket name (publish uploads here; also gates the R2 step) | `.env` | **Variable** |
| `R2_PUBLIC_BASE_URL` | no | Public URL the R2 files are served from; also triggers `latest*.yml` (update manifest) generation | `.env` | **Variable** |
| `R2_ACCESS_KEY_ID` | no | R2 S3 access key id | `.env` | **Secret** |
| `R2_SECRET_ACCESS_KEY` | no | R2 S3 secret access key | `.env` | **Secret** |
| `OH_MY_GITHUB_CDP_PORT` | no | Dev-only Chrome DevTools Protocol port (see README) | env | — |
| `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` | no | Dev network proxy (see README) | env | — |

> **Variable vs Secret:** non-sensitive values go in repo/Org **Variables** (`vars.*`),
> credentials go in **Secrets** (`secrets.*`). `GITHUB_TOKEN` is provided automatically.

## CI/CD

Three workflows under `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | push to `main`, every PR | `pnpm -r typecheck` + `pnpm -r test` |
| `build.yml` | every PR to `main`, manual dispatch | Test-packages macOS / Windows / Linux and uploads the installers as artifacts (unsigned) |
| `publish.yml` | push of a `v*` tag | Packages all platforms → `changelogithub` generates the changelog and creates the GitHub Release → installers are attached to the release and uploaded to Cloudflare R2 |

### Cutting a release

```sh
# bump the version (root + packages/client package.json), commit, then:
git tag v0.2.0
git push origin v0.2.0
```

The tag push triggers `publish.yml`. Installers land on the GitHub Release and, when the R2
variables/secrets are configured, in the R2 bucket for public download.

## Distribution via Cloudflare R2

The repository is private, so GitHub Release assets are not publicly downloadable. The publish
workflow therefore also uploads installers to a **Cloudflare R2** bucket (S3-compatible, zero
egress fees). Make the bucket public via its `*.r2.dev` URL or a custom domain, set the `R2_*`
variables/secrets, and share `R2_PUBLIC_BASE_URL` as the download link. If the R2 variables are
absent the workflow simply skips the upload.

When `R2_PUBLIC_BASE_URL` is set, the build also emits the update manifest
(`latest.yml` / `latest-mac.yml` / `latest-linux.yml`) and bundles an `app-update.yml` pointing
at that URL. These are uploaded alongside the installers (manifests with `Cache-Control: no-cache`).
There is no in-app auto-updater yet — the manifest is published so a future manual "check for
updates" can read the latest version from R2.

## Code signing (optional)

Builds are unsigned by default. To sign:

- **macOS / Windows:** set `CSC_LINK` + `CSC_KEY_PASSWORD`. The build script auto-signs when a
  cert is present (and stays unsigned otherwise).
- **macOS notarization:** additionally set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
  `APPLE_TEAM_ID` and add `notarize: true` under `mac:` in
  `packages/client/electron-builder.yml`.

## Commit & PR conventions

- Commit messages and PR titles follow **Conventional Commits**, in **English**
  (`changelogithub` derives the release notes from them).
- See `AGENTS.md` for repository conventions and the frontend design language.

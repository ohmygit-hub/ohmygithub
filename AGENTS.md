# Oh My GitHub Agent Instructions

## Project Shape

Oh My GitHub is a pnpm workspace for a third-party GitHub desktop client.

- `packages/client` is the Electron desktop app.
  - `src/main` owns Electron main-process work: windows, native integrations, IPC, and local config files.
  - `src/preload` exposes narrow, typed APIs to the renderer through `contextBridge`.
  - `src/renderer` is the Vue frontend. Treat it like the app UI surface, not as a Node context.
- `packages/api` owns GitHub-facing client abstractions, mock data, and typed API contracts.
- `packages/ui` owns shared Vue UI primitives, Tailwind CSS tokens, and the inherited Memoh design contract. Read `packages/ui/AGENTS.md` before changing shared UI components.

Keep process boundaries strict:

- GitHub tokens, filesystem access, local config, and native Electron APIs belong in `main` or carefully scoped preload APIs.
- Renderer code must call preload or package-level API helpers instead of reaching into Node/Electron directly.
- Lightweight local configuration lives at `~/.oh-my-github/config.json`; changes must go through the main-process config layer.
- GitHub OAuth and personal access tokens live at `~/.oh-my-github/auth.json`; renderer code must never persist or inspect raw tokens.

## Frontend Stack

The renderer is Vue 3 + Vite inside Electron. Use the following stack by default:

| Concern | Technology |
| --- | --- |
| Framework | Vue 3 Composition API with `<script setup>` |
| Routing | `vue-router` |
| Client state | Pinia |
| Server/cache state | `@pinia/colada` |
| Persistence | `pinia-plugin-persistedstate` or VueUse storage helpers |
| Utilities | `@vueuse/core`, `@vueuse/integrations` |
| i18n | `vue-i18n` with `legacy: false` |
| Icons | `lucide-vue-next` for UI icons |
| Forms | `vee-validate` + `@vee-validate/zod` + Zod |
| Tables/lists | `@tanstack/vue-table`, `@tanstack/vue-virtual` |
| Dates | `@internationalized/date` or `Intl` helpers |
| Styling | Tailwind CSS 4 + `@oh-my-github/ui` tokens |
| Animation | `animate.css` / `tw-animate-css` when motion is needed |

Use current compatible package versions. Do not pin an older major just because another repo used it; prefer the latest version that passes typecheck and peer dependency constraints.

## Renderer Layout

Use these directories under `packages/client/src/renderer`:

- `main.ts`: app/plugin registration only.
- `App.vue`: root shell/router host only.
- `router.ts`: route definitions and guards.
- `i18n.ts` and `i18n/locales/*.json`: locale setup and messages.
- `stores/`: Pinia stores for durable client state.
- `pages/{feature}/`: route-level pages.
- `pages/{feature}/components/`: page-specific components.
- `pages/{feature}/composables/`: page-specific composables.
- `components/`: shared renderer-only components.
- `composables/`: shared renderer composables.

Prefer Pinia stores for client state such as settings, selected account, active workspace, and UI layout. Prefer Pinia Colada for data fetched from GitHub or from main-process IPC wrappers that represent cacheable server-like state.

## UI Rules

- Use `@oh-my-github/ui` primitives for buttons, badges, cards, tables, menus, dialogs, and form controls.
- Use Lucide components for UI icons. Do not hand-roll inline SVG icons when a Lucide icon exists.
- All user-facing text in renderer pages must go through `vue-i18n`.
- Use semantic design tokens (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, etc.). Do not introduce raw colors or one-off themed CSS.
- Prefer Tailwind utility classes and existing UI components. Avoid scoped `<style>` blocks in Vue pages unless the layout cannot be expressed cleanly through the existing system.
- Keep the desktop-client UI dense and work-focused. This is an operational GitHub workspace, not a marketing site.

## Data And IPC

- Renderer code should not import `electron` or `node:*`.
- Add main-process IPC handlers in small domain modules under `src/main`.
- Expose preload APIs as narrow methods, not broad IPC/string channels.
- Keep preload return types reflected in `src/renderer/env.d.ts`.
- Store lightweight preferences and account selection in `~/.oh-my-github/config.json` through main-process IPC.
- Store auth state in `~/.oh-my-github/auth.json` through main-process IPC; only sanitized auth metadata may cross into renderer.

## GitHub OAuth Scope Policy

- Prefer product capability over minimal OAuth prompts: when adding a GitHub-backed app surface, include the scopes needed for the full intended workflow in `defaultGitHubOAuthScopes`.
- Keep OAuth scope changes synchronized with the API contract, main/preload bridge, renderer types, and `MockGitHubClient`.
- If an existing token is missing newly required OAuth scopes, surface an explicit missing-permissions state in the UI instead of silently hiding data or showing placeholder values.
- Renderer code may receive sanitized scope metadata, but it must never receive or inspect the raw token.

## Validation

Before handing off frontend changes, run:

```bash
pnpm typecheck
pnpm --filter @oh-my-github/client build
```

## Git And PR

- Commit messages must be in English.
- Pull request titles must follow Conventional Commits.

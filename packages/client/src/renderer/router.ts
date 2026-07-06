import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('./pages/auth/auth-page.vue')
  },
  {
    path: '/',
    name: 'workspace-root',
    component: () => import('./pages/workspace/workspace-page.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./pages/settings/settings-page.vue')
  },
  {
    path: '/debug/rich-content',
    name: 'debug-rich-content',
    component: () => import('./pages/debug/rich-content-debug-page.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'workspace',
    component: () => import('./pages/workspace/workspace-page.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (to.name === 'debug-rich-content') {
    return import.meta.env.DEV ? true : { name: 'workspace-root' }
  }

  const auth = await getAuthState()

  if (!auth?.isAuthenticated && to.name !== 'auth') {
    return {
      name: 'auth',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (auth?.isAuthenticated && to.name === 'auth' && to.query.add !== '1') {
    return { name: 'workspace-root' }
  }

  return true
})

async function getAuthState(): Promise<AuthState | null> {
  try {
    return (await window.ohMyGithub?.auth?.get?.()) ?? null
  } catch {
    return null
  }
}

import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('./pages/auth/AuthPage.vue')
  },
  {
    path: '/',
    name: 'workspace',
    component: () => import('./pages/workspace/WorkspacePage.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = await getAuthState()

  if (!auth?.isAuthenticated && to.name !== 'auth') {
    return {
      name: 'auth',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (auth?.isAuthenticated && to.name === 'auth') {
    return { name: 'workspace' }
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

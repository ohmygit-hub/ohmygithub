<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, Copy, Github, Network } from 'lucide-vue-next'
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
} from '@oh-my-github/ui'
import NetworkSettings from '@/pages/settings/components/network/network-settings.vue'
import { useAuthActions } from '@/composables/use-auth-actions'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { completeLogin, switchAccount } = useAuthActions()

const deviceSessionId = ref('')
const deviceCode = ref('')
const verificationUri = ref('')
const errorMessage = ref('')
const token = ref('')
const showTokenForm = ref(false)
const oauthStatus = ref<'idle' | 'opening' | 'waiting' | 'success'>('idle')
const tokenStatus = ref<'idle' | 'saving'>('idle')
const switchingAccountId = ref<number | null>(null)
const showNetworkSettings = ref(false)

const isOAuthLoading = computed(() => oauthStatus.value === 'opening' || oauthStatus.value === 'waiting')
const isTokenSaving = computed(() => tokenStatus.value === 'saving')
const hasAuthBridge = computed(() => Boolean(window.ohMyGithub?.auth))
const canUseOAuth = computed(() => Boolean(authStore.state?.hasGitHubClientId))

onMounted(async () => {
  await authStore.refresh()
  if (!authStore.state) {
    errorMessage.value = t('auth.electronRequired')
  }
})

async function loginWithGitHub(): Promise<void> {
  if (!window.ohMyGithub?.auth || !canUseOAuth.value || isOAuthLoading.value) {
    return
  }

  errorMessage.value = ''
  deviceSessionId.value = ''
  deviceCode.value = ''
  verificationUri.value = ''
  oauthStatus.value = 'opening'

  try {
    const result = await window.ohMyGithub.auth.startDeviceFlow((details) => {
      deviceSessionId.value = details.sessionId
      deviceCode.value = details.userCode
      verificationUri.value = details.verificationUri
      oauthStatus.value = 'waiting'
    })
    oauthStatus.value = 'success'
    await completeLogin(result.auth, resolveRedirectPath())
  } catch (error) {
    oauthStatus.value = 'idle'
    errorMessage.value = resolveErrorMessage(error)
  }
}

async function copyCodeAndOpenGitHub(): Promise<void> {
  if (!window.ohMyGithub?.auth || !deviceSessionId.value) {
    return
  }

  errorMessage.value = ''

  try {
    await window.ohMyGithub.auth.copyCodeAndOpenDeviceFlow(deviceSessionId.value)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  }
}

async function savePersonalToken(): Promise<void> {
  if (!window.ohMyGithub?.auth || isTokenSaving.value) {
    return
  }

  errorMessage.value = ''
  tokenStatus.value = 'saving'

  try {
    const next = await window.ohMyGithub.auth.savePersonalToken(token.value)
    token.value = ''
    await completeLogin(next, resolveRedirectPath())
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    tokenStatus.value = 'idle'
  }
}

async function onSelectAccount(accountId: number): Promise<void> {
  if (switchingAccountId.value !== null) return

  errorMessage.value = ''
  switchingAccountId.value = accountId

  try {
    await switchAccount(accountId)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    switchingAccountId.value = null
  }
}

function goBack(): void {
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.replace({ name: 'workspace-root' })
  }
}

function toggleTokenForm(): void {
  showTokenForm.value = !showTokenForm.value
  errorMessage.value = ''
}

function accountPrimaryLabel(account: AuthAccountSummary): string {
  return account.name?.trim() || account.login
}

function accountFallback(account: AuthAccountSummary): string {
  return accountPrimaryLabel(account).slice(0, 2).toUpperCase()
}

function resolveRedirectPath(): string {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect && redirect !== '/auth') {
    return redirect
  }

  return '/'
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return t('auth.errors.unknown')
}
</script>

<template>
  <main class="auth-page relative grid min-h-full place-items-center bg-background px-6 py-12">
    <Button
      v-if="authStore.isAuthenticated"
      :aria-label="t('auth.back')"
      class="auth-no-drag absolute left-4 top-12"
      size="icon-sm"
      type="button"
      variant="ghost"
      @click="goBack"
    >
      <ArrowLeft class="size-4" />
    </Button>

    <div class="grid w-full max-w-sm gap-4">
      <Card class="auth-no-drag">
        <CardContent class="grid gap-4">
          <div class="grid gap-2 text-center">
            <h1 class="select-none text-title font-semibold text-foreground">{{ t('auth.title') }}</h1>
            <p class="select-none text-body text-muted-foreground">{{ t('auth.subtitle') }}</p>
          </div>

          <Button
            v-if="!showTokenForm"
            :disabled="!canUseOAuth"
            :loading="isOAuthLoading"
            block
            loading-mode="manual"
            size="lg"
            type="button"
            @click="loginWithGitHub"
          >
            <Spinner v-if="isOAuthLoading" />
            <Github v-else class="size-4" />
            {{ t('auth.loginWithGitHub') }}
          </Button>

          <p
            v-if="!showTokenForm && authStore.isLoaded && hasAuthBridge && !canUseOAuth"
            class="text-center text-body text-muted-foreground"
          >
            {{ t('auth.missingClientId') }}
          </p>

          <div
            v-if="!showTokenForm && deviceCode"
            class="grid gap-2 rounded-lg border border-border bg-card p-4 text-center"
          >
            <p class="select-none text-body text-muted-foreground">{{ t('auth.browserOpened') }}</p>
            <div class="select-text rounded-md bg-accent px-3 py-2 text-title font-semibold text-foreground">
              {{ deviceCode }}
            </div>
            <Button
              block
              type="button"
              variant="secondary"
              @click="copyCodeAndOpenGitHub"
            >
              <Copy class="size-4" />
              {{ t('auth.copyCodeAndOpenGitHub') }}
            </Button>
            <p class="text-body text-muted-foreground">
              {{ t('auth.waitingForAuthorization') }}
              <span v-if="verificationUri">{{ verificationUri }}</span>
            </p>
          </div>

          <form
            v-if="showTokenForm"
            class="grid gap-3"
            @submit.prevent="savePersonalToken"
          >
            <Input
              v-model="token"
              autocomplete="off"
              :placeholder="t('auth.tokenPlaceholder')"
              type="password"
            />
            <Button
              :disabled="!token.trim()"
              :loading="isTokenSaving"
              block
              type="submit"
              variant="secondary"
            >
              {{ t('auth.saveToken') }}
            </Button>
          </form>

          <Button
            class="justify-self-center"
            size="text"
            type="button"
            variant="link"
            @click="toggleTokenForm"
          >
            {{ showTokenForm ? t('auth.useOAuth') : t('auth.usePersonalToken') }}
          </Button>

          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <section
        v-if="authStore.accounts.length > 0"
        class="auth-no-drag grid gap-2"
      >
        <h2 class="select-none px-1 text-caption font-medium text-muted-foreground">
          {{ t('auth.switchAccount') }}
        </h2>
        <div class="overflow-hidden rounded-lg border border-border bg-card">
          <button
            v-for="account in authStore.accounts"
            :key="account.id"
            class="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent"
            :disabled="account.id === authStore.activeAccountId || switchingAccountId !== null"
            type="button"
            @click="onSelectAccount(account.id)"
          >
            <Avatar class="size-8">
              <AvatarImage
                v-if="account.avatarUrl"
                :alt="accountPrimaryLabel(account)"
                :src="account.avatarUrl"
              />
              <AvatarFallback class="text-caption">
                {{ accountFallback(account) }}
              </AvatarFallback>
            </Avatar>
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-body font-medium text-foreground">
                {{ accountPrimaryLabel(account) }}
              </span>
              <span class="truncate text-caption text-muted-foreground">
                {{ account.login }}
              </span>
            </span>
            <Spinner
              v-if="switchingAccountId === account.id"
              class="size-4 text-muted-foreground"
            />
            <Check
              v-else-if="account.id === authStore.activeAccountId"
              :aria-label="t('auth.activeAccount')"
              class="size-4 text-muted-foreground"
            />
          </button>
        </div>
      </section>
    </div>

    <Button
      class="auth-no-drag absolute bottom-4 right-4"
      size="sm"
      type="button"
      variant="outline"
      @click="showNetworkSettings = true"
    >
      <Network class="size-4" />
      {{ t('auth.networkSettings') }}
    </Button>

    <Dialog v-model:open="showNetworkSettings">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ t('settings.network.title') }}</DialogTitle>
          <DialogDescription>{{ t('settings.network.description') }}</DialogDescription>
        </DialogHeader>
        <NetworkSettings />
      </DialogContent>
    </Dialog>
  </main>
</template>

<style scoped>
/* The window uses titleBarStyle: 'hiddenInset', so there is no native title bar
   to drag. Make the empty login canvas draggable and keep interactive areas
   (card, back button, account list) clickable. */
.auth-page {
  -webkit-app-region: drag;
}

.auth-no-drag {
  -webkit-app-region: no-drag;
}
</style>

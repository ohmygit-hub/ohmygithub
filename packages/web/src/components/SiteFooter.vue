<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectPlatform, LATEST_RELEASE_URL, resolveLatestDownloadUrl } from '@/lib/downloads'
import { AUTHOR, AUTHOR_URL, ISSUES_URL, TELEGRAM_URL } from '@/lib/site'

const { t } = useI18n()
const year = new Date().getFullYear()
const downloadPlatform = computed(() => detectPlatform())

const linkClass = 'text-muted-foreground transition-colors hover:text-foreground'

async function download() {
  window.location.href = await resolveLatestDownloadUrl(downloadPlatform.value)
}
</script>

<template>
  <footer class="border-t border-border/60">
    <div
      class="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-sm sm:flex-row sm:justify-between sm:px-6"
    >
      <div class="flex flex-col items-center gap-1 sm:items-start">
        <p class="text-muted-foreground">{{ t('footer.copyright', { year }) }}</p>
        <i18n-t keypath="footer.madeBy" tag="p" class="text-muted-foreground">
          <template #author>
            <a :href="AUTHOR_URL" target="_blank" rel="noreferrer" class="text-foreground hover:underline">
              {{ AUTHOR }}
            </a>
          </template>
        </i18n-t>
      </div>

      <nav class="flex items-center gap-5">
        <a :href="LATEST_RELEASE_URL" :class="linkClass" @click.prevent="download">{{ t('footer.download') }}</a>
        <a :href="ISSUES_URL" target="_blank" rel="noreferrer" :class="linkClass">
          {{ t('footer.issues') }}
        </a>
        <a
          v-if="TELEGRAM_URL"
          :href="TELEGRAM_URL"
          target="_blank"
          rel="noreferrer"
          :class="linkClass"
        >
          {{ t('footer.telegram') }}
        </a>
        <span v-else :class="linkClass" class="cursor-default opacity-60">
          {{ t('footer.telegram') }}
        </span>
      </nav>
    </div>
  </footer>
</template>

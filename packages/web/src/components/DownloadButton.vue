<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@oh-my-github/ui'
import { ChevronDown, Download } from 'lucide-vue-next'
import { computed, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import AppleIcon from '@/components/icons/AppleIcon.vue'
import LinuxIcon from '@/components/icons/LinuxIcon.vue'
import WindowsIcon from '@/components/icons/WindowsIcon.vue'
import { APP_VERSION, detectPlatform, LATEST_RELEASE_URL, type OS, type Platform, PLATFORMS, resolveLatestDownloadUrl } from '@/lib/downloads'

const { t } = useI18n()
const detected = computed(() => detectPlatform())
const downloadingId = ref<string | null>(null)

const osIcon: Record<OS, Component> = {
  mac: AppleIcon,
  windows: WindowsIcon,
  linux: LinuxIcon
}

async function download(platform: Platform) {
  downloadingId.value = platform.id
  try {
    window.location.href = await resolveLatestDownloadUrl(platform)
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="flex items-stretch">
      <Button
        as="a"
        :href="LATEST_RELEASE_URL"
        variant="primary"
        size="lg"
        class="rounded-r-none"
        :disabled="downloadingId === detected.id"
        @click.prevent="download(detected)"
      >
        <Download />
        {{ t(detected.labelKey) }}
        <component :is="osIcon[detected.os]" class="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="primary"
            size="lg"
            class="rounded-l-none border-l border-background/20 px-3"
            :aria-label="t('download.otherPlatforms')"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-56">
          <DropdownMenuLabel>{{ t('download.otherPlatforms') }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="p in PLATFORMS"
            :key="p.id"
            as="a"
            :href="LATEST_RELEASE_URL"
            @click.prevent="download(p)"
          >
            <component :is="osIcon[p.os]" class="size-4" />
            {{ t(p.labelKey) }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('download.version', { version: APP_VERSION }) }}
    </p>
  </div>
</template>

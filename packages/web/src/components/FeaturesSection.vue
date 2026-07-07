<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import accountsShot from '@/assets/gallery/7.png'
import actionsShot from '@/assets/gallery/4.png'
import bookmarksClip from '@/assets/gallery/5.mp4'
import customizationShot from '@/assets/gallery/6.png'
import listsShot from '@/assets/gallery/2.png'
import overviewShot from '@/assets/gallery/1.png'
import previewClip from '@/assets/gallery/3.mp4'

const { t } = useI18n()

const features: { key: string, media: string, video?: boolean }[] = [
  { key: 'overview', media: overviewShot },
  { key: 'lists', media: listsShot },
  { key: 'preview', media: previewClip, video: true },
  { key: 'actions', media: actionsShot },
  { key: 'bookmarks', media: bookmarksClip, video: true },
  { key: 'customization', media: customizationShot },
  { key: 'accounts', media: accountsShot }
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h2 class="text-center text-2xl font-medium tracking-tight">
      {{ t('features.title') }}
    </h2>

    <div class="mt-12 flex flex-col gap-16 sm:gap-24">
      <div
        v-for="(feature, index) in features"
        :key="feature.key"
        class="grid items-center gap-6 sm:grid-cols-2 sm:gap-12"
      >
        <div :class="index % 2 === 1 ? 'sm:order-2' : ''">
          <video
            v-if="feature.video"
            :src="feature.media"
            autoplay
            loop
            muted
            playsinline
            class="w-full rounded-xl border border-border"
          />
          <img
            v-else
            :src="feature.media"
            :alt="t(`features.items.${feature.key}.title`)"
            loading="lazy"
            class="w-full"
          />
        </div>

        <div :class="index % 2 === 1 ? 'sm:order-1' : ''">
          <h3 class="text-xl font-medium tracking-tight sm:text-2xl">
            {{ t(`features.items.${feature.key}.title`) }}
          </h3>
          <p class="mt-3 leading-relaxed text-muted-foreground">
            {{ t(`features.items.${feature.key}.description`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

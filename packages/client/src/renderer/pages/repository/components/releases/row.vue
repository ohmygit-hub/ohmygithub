<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronRight,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Rocket,
  Tag,
  Trash2,
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oh-my-github/ui'
import GitHubMarkdownRenderer from '@/components/github/github-markdown-renderer.vue'

const props = defineProps<{
  release: GitHubRelease
  isLatest: boolean
  owner: string
  repo: string
}>()

const emit = defineEmits<{
  edit: [release: GitHubRelease]
  publish: [release: GitHubRelease]
  delete: [release: GitHubRelease]
}>()

const { t } = useI18n()

const expanded = ref(props.isLatest)

const displayTitle = computed(() => props.release.name || props.release.tagName)
const authorLogin = computed(() => props.release.author?.login ?? '')
const authorFallback = computed(() => authorLogin.value.slice(0, 2).toUpperCase() || '?')
const releaseDate = computed(() => {
  const value = props.release.publishedAt ?? props.release.createdAt
  return value ? formatDate(value) : ''
})
const metaText = computed(() => {
  const parts: string[] = []
  if (authorLogin.value) parts.push(authorLogin.value)
  if (releaseDate.value) {
    parts.push(t(
      props.release.publishedAt
        ? 'repository.releases.meta.publishedAt'
        : 'repository.releases.meta.createdAt',
      { date: releaseDate.value },
    ))
  }
  return parts.join(' · ')
})
const sourceLinks = computed(() => [
  { key: 'zip', label: t('repository.releases.assets.sourceZip'), url: props.release.zipballUrl },
  { key: 'tar', label: t('repository.releases.assets.sourceTarGz'), url: props.release.tarballUrl },
].filter((link) => Boolean(link.url)))

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`

  const units = ['KB', 'MB', 'GB']
  let value = size
  let unitIndex = -1

  do {
    value /= 1024
    unitIndex += 1
  } while (value >= 1024 && unitIndex < units.length - 1)

  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`
}

function toggleExpanded(): void {
  expanded.value = !expanded.value
}

function openUrl(url: string | null): void {
  if (!url) return
  void window.ohMyGithub.links.openGitHubUrl(url)
}
</script>

<template>
  <div>
    <div
      class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left outline-hidden transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
      role="button"
      tabindex="0"
      @click="toggleExpanded"
      @keydown.enter.prevent="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <ChevronRight
        class="size-4 shrink-0 text-muted-foreground transition-transform"
        :class="expanded ? 'rotate-90' : ''"
        :stroke-width="1.75"
      />

      <div class="grid min-w-0 gap-1">
        <div class="flex min-w-0 items-center gap-2">
          <span class="min-w-0 truncate text-control font-medium text-foreground">
            {{ displayTitle }}
          </span>
          <Badge
            v-if="release.draft"
            variant="outline"
          >
            {{ t('repository.releases.badges.draft') }}
          </Badge>
          <Badge
            v-else-if="release.prerelease"
            variant="warning"
          >
            {{ t('repository.releases.badges.prerelease') }}
          </Badge>
          <Badge
            v-if="isLatest"
            variant="success"
          >
            {{ t('repository.releases.badges.latest') }}
          </Badge>
        </div>
        <span class="flex min-w-0 items-center gap-2 text-body text-muted-foreground">
          <Avatar
            v-if="authorLogin"
            class="size-4 shrink-0"
          >
            <AvatarImage
              v-if="release.author?.avatarUrl"
              :alt="authorLogin"
              :src="release.author.avatarUrl"
            />
            <AvatarFallback>{{ authorFallback }}</AvatarFallback>
          </Avatar>
          <span class="min-w-0 truncate">{{ metaText }}</span>
          <code class="flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-body text-muted-foreground">
            <Tag
              class="size-3"
              :stroke-width="1.75"
            />
            {{ release.tagName }}
          </code>
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Button
          v-if="release.draft"
          size="sm"
          type="button"
          variant="outline"
          @click.stop="emit('publish', release)"
        >
          <Rocket
            class="size-3.5"
            :stroke-width="1.75"
          />
          {{ t('repository.releases.actions.publish') }}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              :aria-label="t('repository.releases.actions.menu')"
              class="text-muted-foreground"
              size="icon-sm"
              type="button"
              variant="ghost"
              @click.stop
            >
              <MoreHorizontal class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="emit('edit', release)">
              <Pencil class="size-3.5" />
              {{ t('repository.releases.actions.edit') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="openUrl(release.htmlUrl)">
              <ExternalLink class="size-3.5" />
              {{ t('repository.releases.actions.openOnGitHub') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              @click="emit('delete', release)"
            >
              <Trash2 class="size-3.5" />
              {{ t('repository.releases.actions.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div
      v-if="expanded"
      class="grid gap-4 border-t border-border/60 bg-muted/20 px-4 py-4 pl-11"
    >
      <GitHubMarkdownRenderer
        v-if="release.body"
        :content="release.body"
        :owner="owner"
        :repo="repo"
      />
      <p
        v-else
        class="text-body text-muted-foreground"
      >
        {{ t('repository.releases.noDescription') }}
      </p>

      <div
        v-if="release.assets.length > 0 || sourceLinks.length > 0"
        class="grid gap-2"
      >
        <h4 class="text-body font-medium text-foreground">
          {{ t('repository.releases.assets.title') }}
        </h4>
        <ul class="grid gap-1">
          <li
            v-for="asset in release.assets"
            :key="asset.id"
            class="flex min-w-0 items-center gap-2 text-body"
          >
            <Download
              class="size-3.5 shrink-0 text-muted-foreground"
              :stroke-width="1.75"
            />
            <button
              class="min-w-0 truncate text-primary hover:underline"
              type="button"
              @click="openUrl(asset.browserDownloadUrl)"
            >
              {{ asset.name }}
            </button>
            <span class="shrink-0 text-muted-foreground">{{ formatBytes(asset.size) }}</span>
            <span class="shrink-0 text-muted-foreground">
              {{ t('repository.releases.assets.downloads', { count: asset.downloadCount }) }}
            </span>
          </li>
          <li
            v-for="link in sourceLinks"
            :key="link.key"
            class="flex min-w-0 items-center gap-2 text-body"
          >
            <Download
              class="size-3.5 shrink-0 text-muted-foreground"
              :stroke-width="1.75"
            />
            <button
              class="min-w-0 truncate text-primary hover:underline"
              type="button"
              @click="openUrl(link.url)"
            >
              {{ link.label }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

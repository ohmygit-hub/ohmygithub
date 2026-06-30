<script setup lang="ts">
import { computed, inject } from 'vue'
import GitHubActorLink from './github-actor-link.vue'
import GitHubReferenceLink from './github-reference-link.vue'
import GitHubWorkspaceLink from './github-workspace-link.vue'
import { GITHUB_MARKDOWN_CONTEXT_KEY } from './github-markdown-context'
import { parseGitHubReferenceUrl, parseGitHubWorkspaceUrl, trimUrlCandidate } from './github-reference'

interface TextNode {
  content?: string
  raw?: string
}

type TextSegment =
  | { type: 'text', value: string }
  | { type: 'actor', login: string }
  | {
      type: 'reference'
      owner: string
      repo: string
      number: number
      kindHint?: GitHubRepositoryReferenceKind
      fallbackHref?: string
    }
  | {
      type: 'github-link'
      label: string
      workspaceUrl: string
    }

const props = defineProps<{
  node: TextNode
}>()

const context = inject(GITHUB_MARKDOWN_CONTEXT_KEY, null)
const content = computed(() => props.node.content ?? props.node.raw ?? '')
const segments = computed(() => tokenizeText(content.value))

function tokenizeText(value: string): TextSegment[] {
  const owner = context?.value.owner?.trim()
  const repo = context?.value.repo?.trim()
  const segments: TextSegment[] = []
  // The mention branch's trailing guard mirrors GitHub: a login is not a mention when followed by
  // a login-continuation char ([A-Za-z0-9/_-]) or `.<alnum>`, so `@scope/pkg`, `@user_name` and
  // `@user.name` stay plain text. The continuation chars in the lookahead also block the regex from
  // backtracking to a shorter login (e.g. matching `memoha` out of `@memohai/web`).
  const pattern = /https:\/\/github\.com\/[^\s<>"']+|(^|[^A-Za-z0-9_./-])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)(?![A-Za-z0-9/_-]|\.[A-Za-z0-9])|(^|[^A-Za-z0-9_/#-])#([1-9]\d*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value)) !== null) {
    const matchedValue = match[0]

    pushText(segments, value.slice(lastIndex, match.index))

    if (matchedValue.startsWith('https://github.com/')) {
      const trimmed = trimUrlCandidate(matchedValue)
      const reference = parseGitHubReferenceUrl(trimmed.value)

      if (reference) {
        segments.push({
          type: 'reference',
          owner: reference.owner,
          repo: reference.repo,
          number: reference.number,
          kindHint: reference.kindHint,
          fallbackHref: reference.url,
        })
        pushText(segments, trimmed.trailing)
      } else {
        const workspaceUrl = parseGitHubWorkspaceUrl(trimmed.value)

        if (workspaceUrl) {
          segments.push({
            type: 'github-link',
            label: trimmed.value,
            workspaceUrl,
          })
          pushText(segments, trimmed.trailing)
        } else {
          pushText(segments, matchedValue)
        }
      }

      lastIndex = pattern.lastIndex
      continue
    }

    const actorPrefix = match[1]
    const login = match[2]
    const referencePrefix = match[3]
    const referenceNumber = Number(match[4])

    if (login) {
      pushText(segments, actorPrefix)
      segments.push({ type: 'actor', login })
    } else if (owner && repo && Number.isInteger(referenceNumber) && referenceNumber > 0) {
      pushText(segments, referencePrefix)
      segments.push({
        type: 'reference',
        owner,
        repo,
        number: referenceNumber,
        kindHint: undefined,
      })
    } else {
      pushText(segments, matchedValue)
    }

    lastIndex = pattern.lastIndex
  }

  pushText(segments, value.slice(lastIndex))

  return segments
}

function pushText(segments: TextSegment[], value: string | undefined): void {
  if (!value) return

  const previous = segments[segments.length - 1]
  if (previous?.type === 'text') {
    previous.value += value
    return
  }

  segments.push({ type: 'text', value })
}
</script>

<template>
  <template
    v-for="(segment, index) in segments"
    :key="index"
  >
    <template v-if="segment.type === 'text'">{{ segment.value }}</template>
    <GitHubActorLink
      v-else-if="segment.type === 'actor'"
      avatar-size="xs"
      :login="segment.login"
      variant="pill"
    />
    <GitHubReferenceLink
      v-else-if="segment.type === 'reference'"
      :current-owner="context?.owner"
      :current-repo="context?.repo"
      :fallback-href="segment.fallbackHref"
      :kind-hint="segment.kindHint"
      :number="segment.number"
      :owner="segment.owner"
      :repo="segment.repo"
    />
    <GitHubWorkspaceLink
      v-else
      :workspace-url="segment.workspaceUrl"
    >
      {{ segment.label }}
    </GitHubWorkspaceLink>
  </template>
</template>

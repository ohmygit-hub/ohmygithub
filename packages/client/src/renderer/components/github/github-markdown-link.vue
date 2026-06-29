<script setup lang="ts">
import { computed, inject } from 'vue'
import MarkdownRender from 'markstream-vue'
import GitHubReferenceLink from './github-reference-link.vue'
import GitHubWorkspaceLink from './github-workspace-link.vue'
import { GITHUB_MARKDOWN_CONTEXT_KEY } from './github-markdown-context'
import { parseGitHubReferenceUrl, parseGitHubWorkspaceUrl } from './github-reference'

interface LinkChildNode {
  type: string
  raw: string
  [key: string]: unknown
}

interface LinkNode {
  href?: string
  title?: string | null
  text?: string
  children?: LinkChildNode[]
}

const props = defineProps<{
  node: LinkNode
}>()

const context = inject(GITHUB_MARKDOWN_CONTEXT_KEY, null)
const href = computed(() => props.node.href ?? '')
const reference = computed(() => parseGitHubReferenceUrl(href.value))
const workspaceUrl = computed(() => parseGitHubWorkspaceUrl(href.value))
const isExternal = computed(() => /^https?:\/\//i.test(href.value))
const label = computed(() => props.node.text?.trim() || href.value)
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0)
</script>

<template>
  <GitHubReferenceLink
    v-if="reference"
    :current-owner="context?.owner"
    :current-repo="context?.repo"
    :fallback-href="reference.url"
    :kind-hint="reference.kindHint"
    :number="reference.number"
    :owner="reference.owner"
    :repo="reference.repo"
  />

  <GitHubWorkspaceLink
    v-else-if="workspaceUrl"
    :title="node.title ?? undefined"
    :workspace-url="workspaceUrl"
  >
    <MarkdownRender
      v-if="hasChildren"
      :batch-rendering="false"
      :defer-nodes-until-visible="false"
      :fade="false"
      :final="true"
      :node-virtual="false"
      :nodes="node.children"
      render-as-fragment
      :typewriter="false"
    />
    <template v-else>
      {{ label }}
    </template>
  </GitHubWorkspaceLink>

  <a
    v-else
    class="text-primary underline-offset-4 outline-hidden hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/30"
    :href="href"
    rel="noreferrer"
    :target="isExternal ? '_blank' : undefined"
    :title="node.title ?? undefined"
  >
    <MarkdownRender
      v-if="hasChildren"
      :batch-rendering="false"
      :defer-nodes-until-visible="false"
      :fade="false"
      :final="true"
      :node-virtual="false"
      :nodes="node.children"
      render-as-fragment
      :typewriter="false"
    />
    <template v-else>
      {{ label }}
    </template>
  </a>
</template>

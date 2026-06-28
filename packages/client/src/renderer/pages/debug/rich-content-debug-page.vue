<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@oh-my-github/ui'
import {
  MarkdownRenderer,
  MonacoCodeEditor,
  ShikiCode,
  ShikiDiff
} from '../../components/rich-content'

const { t } = useI18n()

const editorCode = ref(`import { createApp } from 'vue'

function greet(name: string) {
  return \`Hello, \${name}\`
}

console.log(greet('Oh My GitHub'))
`)

const markdownContent = computed(() => `# ${t('debug.richContent.sample.heading')}

${t('debug.richContent.sample.body')}

\`\`\`ts
${editorCode.value.trim()}
\`\`\`

\`\`\`mermaid
flowchart TD
  A[${t('debug.richContent.sample.mermaid.inbox')}] --> B{${t('debug.richContent.sample.mermaid.needsReview')}}
  B -->|${t('debug.richContent.sample.mermaid.yes')}| C[${t('debug.richContent.sample.mermaid.openPullRequest')}]
  B -->|${t('debug.richContent.sample.mermaid.no')}| D[${t('debug.richContent.sample.mermaid.archive')}]
  C --> E[${t('debug.richContent.sample.mermaid.leaveReview')}]
\`\`\`

${t('debug.richContent.sample.inlineMath')}: $E = mc^2$

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$
`)

const diffPatch = computed(() => `diff --git a/example.ts b/example.ts
index 1a2b3c4..5d6e7f8 100644
--- a/example.ts
+++ b/example.ts
@@ -1,5 +1,8 @@
 import { createApp } from 'vue'
 
+const appName = 'Oh My GitHub'
+
 function greet(name: string) {
-  return \`Hello, \${name}\`
+  return \`Hello from \${appName}, \${name}\`
 }
`)
</script>

<template>
  <section class="min-h-full bg-background">
    <div class="mx-auto grid w-full max-w-6xl gap-5 px-6 py-6">
      <div class="grid max-w-3xl gap-2">
        <Badge
          class="justify-self-start"
          variant="secondary"
        >
          {{ t('debug.richContent.eyebrow') }}
        </Badge>
        <h1 class="text-heading font-semibold text-foreground">
          {{ t('debug.richContent.title') }}
        </h1>
        <p class="max-w-2xl text-label text-muted-foreground">
          {{ t('debug.richContent.description') }}
        </p>
      </div>

      <div class="grid min-h-[34rem] gap-3 lg:grid-cols-2">
        <section class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card">
          <div class="border-b border-border px-3 py-2 text-label font-medium text-foreground">
            {{ t('debug.richContent.sections.editor') }}
          </div>
          <div class="min-h-0">
            <MonacoCodeEditor
              v-model="editorCode"
              filename="example.ts"
            />
          </div>
        </section>

        <section class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card">
          <div class="border-b border-border px-3 py-2 text-label font-medium text-foreground">
            {{ t('debug.richContent.sections.codePreview') }}
          </div>
          <div class="min-h-0 overflow-auto p-3">
            <ShikiCode
              :code="editorCode"
              filename="example.ts"
            />
          </div>
        </section>
      </div>

      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
        <section class="grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card">
          <div class="border-b border-border px-3 py-2 text-label font-medium text-foreground">
            {{ t('debug.richContent.sections.markdown') }}
          </div>
          <div class="max-h-[38rem] overflow-auto p-4">
            <MarkdownRenderer :content="markdownContent" />
          </div>
        </section>

        <section class="grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card">
          <div class="border-b border-border px-3 py-2 text-label font-medium text-foreground">
            {{ t('debug.richContent.sections.diffPreview') }}
          </div>
          <div class="max-h-[38rem] overflow-auto p-3">
            <ShikiDiff :patch="diffPatch" />
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

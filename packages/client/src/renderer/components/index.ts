export { default as MonacoCodeEditor } from "./editor/monaco-code-editor.vue";
export { default as MarkdownRenderer } from "./markdown/markdown-renderer.vue";
export { default as MermaidRenderer } from "./mermaid/mermaid-renderer.vue";
export { default as ShikiCode } from "./code/shiki-code.vue";
export { default as ShikiDiff } from "./code/shiki-diff.vue";

export {
  getLanguageByFilename,
  normalizeCodeLanguage,
  resolveCodeLanguage,
} from "./code/code-language";
export { type CodeThemePair, useCodeTheme } from "./code/code-theme";

import type { CodeBlockNodeProps } from "markstream-vue";

export type MarkstreamCodeNode = CodeBlockNodeProps["node"];

export interface MarkdownCodeNode {
  type?: "code_block";
  raw?: string;
  code?: string;
  content?: string;
  language?: string;
  loading?: boolean;
}

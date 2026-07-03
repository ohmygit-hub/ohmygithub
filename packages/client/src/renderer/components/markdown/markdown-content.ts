// The markdown pipeline renders `html_inline` nodes from their raw content string,
// which collapses a nested markdown image to its alt text. Codex (and similar bots)
// wrap shields.io priority badges in `<sub>` tags, so unwrap those to let the image
// reach the custom image component.
export function unwrapSubWrappedBadges(content: string): string {
  return content.replace(
    /<sub>\s*(?:<sub>\s*)?(!\[[^\]]*\]\(https?:\/\/img\.shields\.io\/[^)]+\))\s*(?:<\/sub>\s*)?<\/sub>/gi,
    '$1',
  )
}

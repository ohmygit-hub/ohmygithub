import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'conversation-markdown-composer-shell.vue'), 'utf8')

describe('conversation markdown composer shell', () => {
  it('renders the markdown formatting toolbar above the editor', () => {
    expect(source).toContain('MarkdownFormatToolbar')
    expect(source).toContain('@action="applyFormatAction"')
  })

  it('lets the editor move the caret when the mention menu has no candidates', () => {
    // Returning true from the key interceptor preventDefaults the arrow keys,
    // which would trap Up/Down while the menu is open but still empty.
    const arrowBranches = source.match(
      /if \(key === 'Arrow(?:Down|Up)'\) \{\s*\n\s*if \(mentionCandidates\.value\.length === 0\) return (\w+)/g,
    )
    expect(arrowBranches).toHaveLength(2)
    for (const branch of arrowBranches ?? []) {
      expect(branch).toContain('return false')
    }
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'conversation-markdown-editor.vue'), 'utf8')

describe('conversation markdown editor save button', () => {
  it('swaps its leading icon for a spinner instead of adding a second spinner', () => {
    // The save button carried a <Check> icon AND loading-mode="leading", which
    // draws the icon plus an extra leading spinner. Use the manual swap so the
    // icon becomes the spinner in place while saving.
    expect(source).not.toContain('loading-mode="leading"')
    expect(source).toMatch(/:loading="isSubmitting"\s+loading-mode="manual"/)
    expect(source).toMatch(/<Spinner\s+v-if="isSubmitting"[\s\S]*?<Check\s+v-else/)
  })
})

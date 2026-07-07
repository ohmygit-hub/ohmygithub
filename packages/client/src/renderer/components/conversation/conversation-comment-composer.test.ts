import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'conversation-comment-composer.vue'), 'utf8')

describe('conversation comment composer submit button', () => {
  it('swaps its leading icon for a spinner instead of adding a second spinner', () => {
    // loading-mode="leading" grows an extra spinner slot BEFORE the slotted
    // <Send> icon, so a busy button shows two glyphs. The submit button must use
    // the manual swap (Spinner replaces the icon in place) like the rest of the app.
    expect(source).not.toContain('loading-mode="leading"')
    expect(source).toMatch(/:loading="isSubmitting"\s+loading-mode="manual"/)
    expect(source).toMatch(/<Spinner\s+v-if="isSubmitting"[\s\S]*?<Send\s+v-else/)
  })
})

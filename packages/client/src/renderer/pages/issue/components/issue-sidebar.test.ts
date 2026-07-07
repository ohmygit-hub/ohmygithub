import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'issue-sidebar.vue'), 'utf8')

describe('issue sidebar state-action buttons', () => {
  it('swap their leading icon for a spinner instead of adding a second spinner', () => {
    // The reopen / close-completed / close-not-planned buttons each carried a
    // lucide icon AND loading-mode="leading", so saving showed the icon plus an
    // extra leading spinner. Each must use the manual swap (Spinner in place of
    // the icon while isSavingField).
    expect(source).not.toContain('loading-mode="leading"')
    expect(source).toMatch(/<Spinner\s+v-if="isSavingField"[\s\S]*?<RotateCcw\s+v-else/)
    expect(source).toMatch(/<Spinner\s+v-if="isSavingField"[\s\S]*?<CheckCircle2\s+v-else/)
    expect(source).toMatch(/<Spinner\s+v-if="isSavingField"[\s\S]*?<CircleSlash\s+v-else/)
  })
})

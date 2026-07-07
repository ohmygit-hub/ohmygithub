import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, 'pull-request-sidebar.vue'), 'utf8')

describe('pull request sidebar action buttons', () => {
  it('swaps the ready-for-review icon for a spinner instead of adding a second one', () => {
    expect(source).not.toMatch(/:loading="isMarkingReady"\s+loading-mode="leading"/)
    expect(source).toMatch(/:loading="isMarkingReady"\s+loading-mode="manual"/)
    expect(source).toMatch(/<Spinner\s+v-if="isMarkingReady"[\s\S]*?<GitPullRequest\s+v-else/)
  })

  it('swaps the close-pull-request icon for a spinner instead of adding a second one', () => {
    expect(source).not.toMatch(/:loading="isClosing"\s+loading-mode="leading"/)
    expect(source).toMatch(/:loading="isClosing"\s+loading-mode="manual"/)
    expect(source).toMatch(/<Spinner\s+v-if="isClosing"[\s\S]*?<XCircle\s+v-else/)
  })

  it('keeps loading-mode="leading" for buttons whose icon is hidden while busy', () => {
    // The merge button hides its <GitMerge> via v-if="showMergeActionIcon"
    // (=!isMerging) and the confirm button is text-only, so the leading spinner
    // has nothing to double up with. Those must stay on leading mode.
    expect(source).toMatch(/:loading="isMerging"\s+loading-mode="leading"/)
  })
})

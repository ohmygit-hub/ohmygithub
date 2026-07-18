import { readonly, ref } from 'vue'

export interface ReviewCommentSelection {
  owner: string
  repo: string
  number: number
  path: string
  side: GitHubPullRequestDiffSide
  startLine: number | null
  line: number
}

// Module-level state (same pattern as use-right-panel): the diff panel writes
// the selection while the review tab composer reads it across the tree.
const selection = ref<ReviewCommentSelection | null>(null)
const locatedThreadId = ref<string | null>(null)

export function useReviewSelection() {
  function setSelection(next: ReviewCommentSelection): void {
    selection.value = next
  }

  function clearSelection(): void {
    selection.value = null
  }

  function locateThread(threadId: string): void {
    locatedThreadId.value = threadId
  }

  function clearLocatedThread(): void {
    locatedThreadId.value = null
  }

  return {
    selection: readonly(selection),
    locatedThreadId: readonly(locatedThreadId),
    setSelection,
    clearSelection,
    locateThread,
    clearLocatedThread,
  }
}

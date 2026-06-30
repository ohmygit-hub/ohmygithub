import { readonly, ref, shallowRef } from 'vue'

export type RightPanelContent =
  | {
      type: 'code'
      code: string
      filename?: string
      language?: string
      title?: string
    }
  | {
      type: 'diff'
      patch: string
      filename: string
      language?: string
      additions?: number
      deletions?: number
      title?: string
    }
  | {
      type: 'markdown'
      content: string
      owner?: string | null
      repo?: string | null
      title?: string
    }
  | {
      type: 'image'
      src: string
      alt?: string
      title?: string
    }
  | {
      type: 'video'
      src: string
      poster?: string
      title?: string
    }
  | {
      type: 'download'
      url: string
      description?: string | null
      filename?: string
      title?: string
    }

const isOpen = ref(false)
const content = shallowRef<RightPanelContent | null>(null)

export function useRightPanel() {
  function openRightPanel(nextContent?: RightPanelContent): void {
    if (nextContent) {
      content.value = nextContent
    }

    isOpen.value = true
  }

  function closeRightPanel(): void {
    isOpen.value = false
  }

  function toggleRightPanel(nextContent?: RightPanelContent): void {
    if (nextContent) {
      content.value = nextContent
    }

    isOpen.value = !isOpen.value
  }

  function setRightPanelContent(nextContent: RightPanelContent): void {
    content.value = nextContent
  }

  function clearRightPanel(): void {
    content.value = null
  }

  return {
    clearRightPanel,
    closeRightPanel,
    content: readonly(content),
    isOpen: readonly(isOpen),
    openRightPanel,
    setRightPanelContent,
    toggleRightPanel,
  }
}

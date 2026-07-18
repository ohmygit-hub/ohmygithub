export const MIN_RIGHT_PANEL_WIDTH = 320
export const MAX_RIGHT_PANEL_WIDTH = 1440
export const MIN_WORKSPACE_CONTENT_WIDTH = 400

const DEFAULT_RIGHT_PANEL_RATIO = 0.56

export function getRightPanelMaxWidth(workspaceWidth: number): number {
  const availableWidth = Math.floor(workspaceWidth - MIN_WORKSPACE_CONTENT_WIDTH)
  return Math.max(MIN_RIGHT_PANEL_WIDTH, Math.min(MAX_RIGHT_PANEL_WIDTH, availableWidth))
}

export function clampRightPanelWidth(width: number, workspaceWidth: number): number {
  const maxWidth = getRightPanelMaxWidth(workspaceWidth)
  return Math.min(maxWidth, Math.max(MIN_RIGHT_PANEL_WIDTH, Math.round(width)))
}

export function getDefaultRightPanelWidth(workspaceWidth: number): number {
  return clampRightPanelWidth(workspaceWidth * DEFAULT_RIGHT_PANEL_RATIO, workspaceWidth)
}

import { describe, expect, it } from 'vitest'
import {
  MAX_RIGHT_PANEL_WIDTH,
  MIN_RIGHT_PANEL_WIDTH,
  clampRightPanelWidth,
  getDefaultRightPanelWidth,
  getRightPanelMaxWidth,
} from './right-panel-width'

describe('right panel width', () => {
  it('uses a wider responsive default while preserving the main workspace', () => {
    expect(getDefaultRightPanelWidth(1176)).toBe(659)
    expect(getDefaultRightPanelWidth(2176)).toBe(1219)
  })

  it('falls back to the minimum width in a narrow workspace', () => {
    expect(getDefaultRightPanelWidth(656)).toBe(MIN_RIGHT_PANEL_WIDTH)
    expect(getRightPanelMaxWidth(656)).toBe(MIN_RIGHT_PANEL_WIDTH)
  })

  it('reserves room for workspace content when expanded', () => {
    expect(getRightPanelMaxWidth(1176)).toBe(776)
    expect(getRightPanelMaxWidth(2176)).toBe(MAX_RIGHT_PANEL_WIDTH)
  })

  it('clamps stored and dragged widths to the current workspace', () => {
    expect(clampRightPanelWidth(120, 1600)).toBe(MIN_RIGHT_PANEL_WIDTH)
    expect(clampRightPanelWidth(2000, 1600)).toBe(1200)
    expect(clampRightPanelWidth(640.4, 1600)).toBe(640)
  })
})

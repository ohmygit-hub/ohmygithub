import { describe, expect, it } from 'vitest'
import { shouldRefetchCompletedLog } from './use-action-run-live-refresh'

describe('shouldRefetchCompletedLog', () => {
  it('requests one final log refetch when the selected job finishes', () => {
    expect(shouldRefetchCompletedLog([true, true, 42], [true, false, 42])).toBe(true)
  })

  it('does not refetch when the tab is inactive', () => {
    expect(shouldRefetchCompletedLog([true, true, 42], [false, false, 42])).toBe(false)
  })

  it('does not refetch when the selection changed to a different job', () => {
    expect(shouldRefetchCompletedLog([true, true, 42], [true, false, 7])).toBe(false)
  })

  it('does not refetch while the job is still running', () => {
    expect(shouldRefetchCompletedLog([true, true, 42], [true, true, 42])).toBe(false)
  })

  it('does not refetch on the first evaluation', () => {
    expect(shouldRefetchCompletedLog(undefined, [true, false, 42])).toBe(false)
  })
})

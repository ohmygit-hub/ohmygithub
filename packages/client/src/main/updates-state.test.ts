import { describe, expect, it } from 'vitest'
import {
  createInitialUpdateState,
  reduceUpdateState,
  type UpdateState,
} from './updates-state'

describe('update state transitions', () => {
  const initial = createInitialUpdateState('0.0.2')

  it('moves through checking, available, downloading, and downloaded states', () => {
    const checking = reduceUpdateState(initial, { type: 'checking' })
    expect(checking).toMatchObject({ status: 'checking', currentVersion: '0.0.2' })

    const available = reduceUpdateState(checking, {
      type: 'available',
      latestVersion: '0.0.3',
    })
    expect(available).toMatchObject({
      status: 'available',
      latestVersion: '0.0.3',
      progress: null,
      error: null,
    })

    const downloading = reduceUpdateState(available, {
      type: 'download-progress',
      percent: 42.4,
    })
    expect(downloading).toMatchObject({
      status: 'downloading',
      latestVersion: '0.0.3',
      progress: 42,
    })

    const downloaded = reduceUpdateState(downloading, {
      type: 'downloaded',
      latestVersion: '0.0.3',
    })
    expect(downloaded).toMatchObject({
      status: 'downloaded',
      latestVersion: '0.0.3',
      progress: 100,
      error: null,
    })
  })

  it('records up-to-date, unavailable, and error terminal states', () => {
    const upToDate = reduceUpdateState(initial, {
      type: 'not-available',
      latestVersion: '0.0.2',
    })
    expect(upToDate).toMatchObject({
      status: 'up-to-date',
      latestVersion: '0.0.2',
      progress: null,
      error: null,
    })

    const unavailable = reduceUpdateState(upToDate, {
      type: 'unavailable',
      error: 'Updater is not available in development builds.',
    })
    expect(unavailable).toMatchObject({
      status: 'unavailable',
      latestVersion: null,
      error: 'Updater is not available in development builds.',
    })

    const failed = reduceUpdateState(unavailable, {
      type: 'error',
      error: new Error('Network failed'),
    })
    expect(failed).toMatchObject({
      status: 'error',
      error: 'Network failed',
      progress: null,
    })
  })

  it('preserves the known latest version when download progress omits version data', () => {
    const state: UpdateState = {
      status: 'available',
      currentVersion: '0.0.2',
      latestVersion: '0.0.3',
      progress: null,
      error: null,
    }

    expect(reduceUpdateState(state, { type: 'download-progress', percent: 8.9 })).toMatchObject({
      status: 'downloading',
      latestVersion: '0.0.3',
      progress: 9,
    })
  })
})

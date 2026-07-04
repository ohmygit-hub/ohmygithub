import { describe, expect, it } from 'vitest'
import {
  createActionRunWorkspaceUrl,
  createRepositoryWorkspaceUrl,
  createWorkspaceTabFromUrl,
  normalizeWorkspaceUrl,
} from './workspace-url'

describe('action run workspace URLs', () => {
  it('preserves the selected workflow job in the query string', () => {
    expect(createActionRunWorkspaceUrl('octo-org', 'hello-world', 123, 456))
      .toBe('/octo-org/hello-world/actions/runs/123?job=456')
    expect(normalizeWorkspaceUrl('/octo-org/hello-world/actions/runs/123?job=456'))
      .toBe('/octo-org/hello-world/actions/runs/123?job=456')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world/actions/runs/123?job=456'))
      .toMatchObject({
        type: 'action-run',
        owner: 'octo-org',
        repo: 'hello-world',
        runId: 123,
        jobId: 456,
        url: '/octo-org/hello-world/actions/runs/123?job=456',
      })
  })
})

describe('new repository workspace URLs', () => {
  it('parses /new-repository as an internal tab', () => {
    expect(normalizeWorkspaceUrl('/new-repository')).toBe('/new-repository')
    expect(createWorkspaceTabFromUrl('/new-repository')).toMatchObject({
      type: 'new-repository',
      url: '/new-repository',
      title: 'New Repository',
    })
  })

  it('does not treat new-repository as an account path', () => {
    expect(createWorkspaceTabFromUrl('/new-repository').type).not.toBe('account')
  })
})

describe('repository settings workspace URLs', () => {
  it('normalizes the legacy settings tab token to settings-general', () => {
    expect(normalizeWorkspaceUrl('/octo-org/hello-world?tab=settings'))
      .toBe('/octo-org/hello-world?tab=settings-general')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world?tab=settings'))
      .toMatchObject({ type: 'repo', repositorySection: 'settingsGeneral' })
  })

  it('round-trips settings category tabs', () => {
    expect(createRepositoryWorkspaceUrl('octo-org', 'hello-world', 'settingsAutomation'))
      .toBe('/octo-org/hello-world?tab=settings-automation')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world?tab=settings-security'))
      .toMatchObject({ type: 'repo', repositorySection: 'settingsSecurity' })
  })

  it('keeps a valid non-default settings sub page in the query string', () => {
    expect(createRepositoryWorkspaceUrl('octo-org', 'hello-world', 'settingsAutomation', 'webhooks'))
      .toBe('/octo-org/hello-world?tab=settings-automation&sub=webhooks')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world?tab=settings-automation&sub=webhooks'))
      .toMatchObject({ repositorySection: 'settingsAutomation', repositorySettingsSub: 'webhooks' })
  })

  it('drops invalid, default-first, or misplaced sub pages', () => {
    expect(normalizeWorkspaceUrl('/octo-org/hello-world?tab=settings-automation&sub=nope'))
      .toBe('/octo-org/hello-world?tab=settings-automation')
    expect(normalizeWorkspaceUrl('/octo-org/hello-world?tab=settings-automation&sub=branches'))
      .toBe('/octo-org/hello-world?tab=settings-automation')
    expect(normalizeWorkspaceUrl('/octo-org/hello-world?tab=commits&sub=webhooks'))
      .toBe('/octo-org/hello-world?tab=commits')
  })
})

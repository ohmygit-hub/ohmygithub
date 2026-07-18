import { describe, expect, it } from 'vitest'
import {
  createActionRunWorkspaceUrl,
  createRepositoryWorkspaceUrl,
  createTeamWorkspaceUrl,
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

  it('round-trips the secrets section with a non-default scope tab', () => {
    expect(createRepositoryWorkspaceUrl('octo-org', 'hello-world', 'settingsSecrets'))
      .toBe('/octo-org/hello-world?tab=settings-secrets')
    expect(createRepositoryWorkspaceUrl('octo-org', 'hello-world', 'settingsSecrets', 'dependabot'))
      .toBe('/octo-org/hello-world?tab=settings-secrets&sub=dependabot')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world?tab=settings-secrets&sub=dependabot'))
      .toMatchObject({ repositorySection: 'settingsSecrets', repositorySettingsSub: 'dependabot' })
  })

  it('remaps the legacy security secrets sub page to the secrets section', () => {
    expect(normalizeWorkspaceUrl('/octo-org/hello-world?tab=settings-security&sub=secrets'))
      .toBe('/octo-org/hello-world?tab=settings-secrets')
    expect(createWorkspaceTabFromUrl('/octo-org/hello-world?tab=settings-security&sub=secrets'))
      .toMatchObject({ repositorySection: 'settingsSecrets', repositorySettingsSub: undefined })
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

describe('team workspace URLs', () => {
  it('creates team urls with the members section as the default', () => {
    expect(createTeamWorkspaceUrl('octo-org', 'core')).toBe('/orgs/octo-org/teams/core')
    expect(createTeamWorkspaceUrl('octo-org', 'core', 'repositories'))
      .toBe('/orgs/octo-org/teams/core?tab=repositories')
  })

  it('parses a team url into a team tab', () => {
    expect(createWorkspaceTabFromUrl('/orgs/octo-org/teams/core')).toMatchObject({
      type: 'team',
      owner: 'octo-org',
      teamSlug: 'core',
      teamSection: 'members',
      url: '/orgs/octo-org/teams/core',
      title: '@octo-org/core',
    })
    expect(createWorkspaceTabFromUrl('/orgs/octo-org/teams/core?tab=settings')).toMatchObject({
      type: 'team',
      teamSection: 'settings',
      url: '/orgs/octo-org/teams/core?tab=settings',
    })
  })

  it('maps GitHub-style team sub paths onto section tabs', () => {
    expect(normalizeWorkspaceUrl('/orgs/octo-org/teams/core/repositories'))
      .toBe('/orgs/octo-org/teams/core?tab=repositories')
    expect(normalizeWorkspaceUrl('/orgs/octo-org/teams/core/members'))
      .toBe('/orgs/octo-org/teams/core')
    expect(createWorkspaceTabFromUrl('/orgs/octo-org/teams/core/teams'))
      .toMatchObject({ type: 'team', teamSection: 'teams' })
  })

  it('maps the org teams index to the account teams section', () => {
    expect(normalizeWorkspaceUrl('/orgs/octo-org/teams')).toBe('/octo-org?tab=teams')
    expect(createWorkspaceTabFromUrl('/orgs/octo-org/teams')).toMatchObject({
      type: 'account',
      owner: 'octo-org',
      accountSection: 'teams',
    })
  })

  it('maps a bare org path to the account tab', () => {
    expect(normalizeWorkspaceUrl('/orgs/octo-org')).toBe('/octo-org')
    expect(createWorkspaceTabFromUrl('/orgs/octo-org')).toMatchObject({
      type: 'account',
      owner: 'octo-org',
      accountSection: 'overview',
    })
  })

  it('drops invalid team sections back to members', () => {
    expect(normalizeWorkspaceUrl('/orgs/octo-org/teams/core?tab=nope'))
      .toBe('/orgs/octo-org/teams/core')
  })
})

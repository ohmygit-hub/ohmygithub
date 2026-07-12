import {
  createGitHubApi,
  type GitHubInteractionLimitExpiry,
  type GitHubInteractionLimitGroup,
  type GitHubRepositoryCollaboratorRole,
  type GitHubRepositoryCustomPropertyValue,
  type GitHubRepositorySecretScope,
  type GitHubRulesetEnforcement,
  type UpdateRepositoryGeneralSettingsInput,
  type UpdateSecurityAndAnalysisInput,
  type UpsertEnvironmentInput,
  type UpsertRepositoryWebhookInput,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerRepositorySettingsIpc(): void {
  ipcMain.handle('repository-settings:get-general', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.getGeneralSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:update-general',
    async (_event, owner: string, repo: string, input: UpdateRepositoryGeneralSettingsInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.updateGeneralSettings({
        ...normalizeRepository(owner, repo),
        input,
      })
  )
  ipcMain.handle('repository-settings:replace-topics', async (_event, owner: string, repo: string, names: string[]) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.replaceTopics({
      ...normalizeRepository(owner, repo),
      names: Array.isArray(names) ? names.map((name) => String(name).trim()).filter(Boolean) : [],
    })
  )
  ipcMain.handle('repository-settings:set-discussions', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setDiscussionsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle('repository-settings:set-sponsorships', async (_event, repositoryNodeId: string, enabled: boolean) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.setSponsorshipsEnabled({
      repositoryNodeId: String(repositoryNodeId),
      enabled: Boolean(enabled),
    })
  )
  ipcMain.handle(
    'repository-settings:set-immutable-releases',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.setImmutableReleases({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle(
    'repository-settings:transfer',
    async (_event, owner: string, repo: string, newOwner: string, newName?: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettings.transferRepository({
        ...normalizeRepository(owner, repo),
        newOwner: String(newOwner ?? '').trim(),
        newName: newName ? String(newName).trim() : undefined,
      })
  )
  ipcMain.handle('repository-settings:delete', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettings.deleteRepository(normalizeRepository(owner, repo))
  )

  ipcMain.handle('repository-settings:access-overview', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAccess.getAccessOverview(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:access-add-collaborator',
    async (_event, owner: string, repo: string, username: string, permission: GitHubRepositoryCollaboratorRole) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.addCollaborator({
        ...normalizeRepository(owner, repo),
        username: String(username ?? '').trim(),
        permission,
      })
  )
  ipcMain.handle(
    'repository-settings:access-remove-collaborator',
    async (_event, owner: string, repo: string, username: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.removeCollaborator({
        ...normalizeRepository(owner, repo),
        username: String(username ?? '').trim(),
      })
  )
  ipcMain.handle(
    'repository-settings:access-update-invitation',
    async (_event, owner: string, repo: string, invitationId: number, permissions: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.updateInvitation({
        ...normalizeRepository(owner, repo),
        invitationId: Number(invitationId),
        permissions: String(permissions ?? ''),
      })
  )
  ipcMain.handle(
    'repository-settings:access-cancel-invitation',
    async (_event, owner: string, repo: string, invitationId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.cancelInvitation({
        ...normalizeRepository(owner, repo),
        invitationId: Number(invitationId),
      })
  )
  ipcMain.handle(
    'repository-settings:access-set-team',
    async (_event, org: string, teamSlug: string, owner: string, repo: string, permission: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.addOrUpdateTeam({
        ...normalizeRepository(owner, repo),
        org: String(org ?? '').trim(),
        teamSlug: String(teamSlug ?? '').trim(),
        permission: String(permission ?? 'pull'),
      })
  )
  ipcMain.handle(
    'repository-settings:access-remove-team',
    async (_event, org: string, teamSlug: string, owner: string, repo: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.removeTeam({
        ...normalizeRepository(owner, repo),
        org: String(org ?? '').trim(),
        teamSlug: String(teamSlug ?? '').trim(),
      })
  )
  ipcMain.handle('repository-settings:access-interaction-limits', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAccess.getInteractionLimits(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:access-set-interaction-limits',
    async (
      _event,
      owner: string,
      repo: string,
      limit: GitHubInteractionLimitGroup,
      expiry?: GitHubInteractionLimitExpiry,
    ) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.setInteractionLimits({
        ...normalizeRepository(owner, repo),
        limit,
        expiry,
      })
  )
  ipcMain.handle(
    'repository-settings:access-clear-interaction-limits',
    async (_event, owner: string, repo: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAccess.clearInteractionLimits(
        normalizeRepository(owner, repo),
      )
  )

  ipcMain.handle('repository-settings:automation-protected-branches', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.listProtectedBranches(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-delete-branch-protection',
    async (_event, owner: string, repo: string, branch: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteBranchProtection({
        ...normalizeRepository(owner, repo),
        branch: String(branch ?? '').trim(),
      })
  )
  ipcMain.handle('repository-settings:automation-rulesets', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.listRulesets(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-set-ruleset-enforcement',
    async (_event, owner: string, repo: string, rulesetId: number, enforcement: GitHubRulesetEnforcement) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.setRulesetEnforcement({
        ...normalizeRepository(owner, repo),
        rulesetId: Number(rulesetId),
        enforcement,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-delete-ruleset',
    async (_event, owner: string, repo: string, rulesetId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteRuleset({
        ...normalizeRepository(owner, repo),
        rulesetId: Number(rulesetId),
      })
  )
  ipcMain.handle('repository-settings:automation-actions-settings', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.getActionsSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-update-actions-permissions',
    async (_event, owner: string, repo: string, enabled: boolean, allowedActions?: 'all' | 'local_only' | 'selected') =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateActionsPermissions({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
        allowedActions,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-selected-actions',
    async (
      _event,
      owner: string,
      repo: string,
      githubOwnedAllowed: boolean,
      verifiedAllowed: boolean,
      patternsAllowed: string[],
    ) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateSelectedActions({
        ...normalizeRepository(owner, repo),
        githubOwnedAllowed: Boolean(githubOwnedAllowed),
        verifiedAllowed: Boolean(verifiedAllowed),
        patternsAllowed: Array.isArray(patternsAllowed)
          ? patternsAllowed.map((pattern) => String(pattern).trim()).filter(Boolean)
          : [],
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-workflow-permissions',
    async (_event, owner: string, repo: string, defaultWorkflowPermissions: 'read' | 'write', canApprovePullRequestReviews: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateWorkflowPermissions({
        ...normalizeRepository(owner, repo),
        defaultWorkflowPermissions,
        canApprovePullRequestReviews: Boolean(canApprovePullRequestReviews),
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-access-level',
    async (_event, owner: string, repo: string, accessLevel: 'none' | 'user' | 'organization') =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateAccessLevel({
        ...normalizeRepository(owner, repo),
        accessLevel,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-retention',
    async (_event, owner: string, repo: string, days: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateRetention({
        ...normalizeRepository(owner, repo),
        days: Number(days),
      })
  )
  ipcMain.handle('repository-settings:automation-runners', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.listRunners(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-delete-runner',
    async (_event, owner: string, repo: string, runnerId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteRunner({
        ...normalizeRepository(owner, repo),
        runnerId: Number(runnerId),
      })
  )
  ipcMain.handle('repository-settings:automation-webhooks', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.listWebhooks(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-create-webhook',
    async (_event, owner: string, repo: string, input: UpsertRepositoryWebhookInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.createWebhook({
        ...normalizeRepository(owner, repo),
        input,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-webhook',
    async (_event, owner: string, repo: string, hookId: number, input: UpsertRepositoryWebhookInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateWebhook({
        ...normalizeRepository(owner, repo),
        hookId: Number(hookId),
        input,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-delete-webhook',
    async (_event, owner: string, repo: string, hookId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteWebhook({
        ...normalizeRepository(owner, repo),
        hookId: Number(hookId),
      })
  )
  ipcMain.handle(
    'repository-settings:automation-ping-webhook',
    async (_event, owner: string, repo: string, hookId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.pingWebhook({
        ...normalizeRepository(owner, repo),
        hookId: Number(hookId),
      })
  )
  ipcMain.handle('repository-settings:automation-environments', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.listEnvironmentSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-upsert-environment',
    async (_event, owner: string, repo: string, environmentName: string, input: UpsertEnvironmentInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.upsertEnvironment({
        ...normalizeRepository(owner, repo),
        environmentName: String(environmentName ?? '').trim(),
        input,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-delete-environment',
    async (_event, owner: string, repo: string, environmentName: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteEnvironment({
        ...normalizeRepository(owner, repo),
        environmentName: String(environmentName ?? '').trim(),
      })
  )
  ipcMain.handle(
    'repository-settings:automation-create-environment-branch-policy',
    async (_event, owner: string, repo: string, environmentName: string, name: string, type: 'branch' | 'tag') =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.createEnvironmentBranchPolicy({
        ...normalizeRepository(owner, repo),
        environmentName: String(environmentName ?? '').trim(),
        name: String(name ?? '').trim(),
        type,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-delete-environment-branch-policy',
    async (_event, owner: string, repo: string, environmentName: string, branchPolicyId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.deleteEnvironmentBranchPolicy({
        ...normalizeRepository(owner, repo),
        environmentName: String(environmentName ?? '').trim(),
        branchPolicyId: Number(branchPolicyId),
      })
  )
  ipcMain.handle('repository-settings:automation-pages', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.getPagesSettings(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-enable-pages',
    async (_event, owner: string, repo: string, buildType: 'legacy' | 'workflow', sourceBranch?: string, sourcePath?: '/' | '/docs') =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.enablePages({
        ...normalizeRepository(owner, repo),
        buildType,
        sourceBranch,
        sourcePath,
      })
  )
  ipcMain.handle(
    'repository-settings:automation-update-pages',
    async (
      _event,
      owner: string,
      repo: string,
      input: {
        cname?: string | null
        httpsEnforced?: boolean
        buildType?: 'legacy' | 'workflow'
        sourceBranch?: string
        sourcePath?: '/' | '/docs'
      },
    ) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updatePages({
        ...normalizeRepository(owner, repo),
        ...input,
      })
  )
  ipcMain.handle('repository-settings:automation-disable-pages', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.disablePages(normalizeRepository(owner, repo))
  )
  ipcMain.handle('repository-settings:automation-request-pages-build', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.requestPagesBuild(normalizeRepository(owner, repo))
  )
  ipcMain.handle('repository-settings:automation-custom-properties', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.getCustomPropertyValues(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:automation-update-custom-properties',
    async (_event, owner: string, repo: string, values: GitHubRepositoryCustomPropertyValue[]) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsAutomation.updateCustomPropertyValues({
        ...normalizeRepository(owner, repo),
        values: Array.isArray(values) ? values : [],
      })
  )
  ipcMain.handle('repository-settings:security-overview', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.getSecurityOverview(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:security-update-analysis',
    async (_event, owner: string, repo: string, input: UpdateSecurityAndAnalysisInput) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.updateSecurityAndAnalysis({
        ...normalizeRepository(owner, repo),
        input,
      })
  )
  ipcMain.handle(
    'repository-settings:security-set-vulnerability-alerts',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.setVulnerabilityAlerts({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle(
    'repository-settings:security-set-automated-fixes',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.setAutomatedSecurityFixes({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle(
    'repository-settings:security-set-private-reporting',
    async (_event, owner: string, repo: string, enabled: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.setPrivateVulnerabilityReporting({
        ...normalizeRepository(owner, repo),
        enabled: Boolean(enabled),
      })
  )
  ipcMain.handle('repository-settings:security-deploy-keys', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.listDeployKeys(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:security-add-deploy-key',
    async (_event, owner: string, repo: string, title: string, key: string, readOnly: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.addDeployKey({
        ...normalizeRepository(owner, repo),
        title: String(title ?? '').trim(),
        key: String(key ?? '').trim(),
        readOnly: Boolean(readOnly),
      })
  )
  ipcMain.handle(
    'repository-settings:security-delete-deploy-key',
    async (_event, owner: string, repo: string, keyId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.deleteDeployKey({
        ...normalizeRepository(owner, repo),
        keyId: Number(keyId),
      })
  )
  ipcMain.handle(
    'repository-settings:security-secrets',
    async (_event, owner: string, repo: string, scope: GitHubRepositorySecretScope) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.listSecrets({
        ...normalizeRepository(owner, repo),
        scope,
      })
  )
  ipcMain.handle(
    'repository-settings:security-upsert-secret',
    async (_event, owner: string, repo: string, scope: GitHubRepositorySecretScope, name: string, value: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.upsertSecret({
        ...normalizeRepository(owner, repo),
        scope,
        name: String(name ?? '').trim(),
        value: String(value ?? ''),
      })
  )
  ipcMain.handle(
    'repository-settings:security-delete-secret',
    async (_event, owner: string, repo: string, scope: GitHubRepositorySecretScope, name: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.deleteSecret({
        ...normalizeRepository(owner, repo),
        scope,
        name: String(name ?? '').trim(),
      })
  )
  ipcMain.handle('repository-settings:security-variables', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.listVariables(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:security-create-variable',
    async (_event, owner: string, repo: string, name: string, value: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.createVariable({
        ...normalizeRepository(owner, repo),
        name: String(name ?? '').trim(),
        value: String(value ?? ''),
      })
  )
  ipcMain.handle(
    'repository-settings:security-update-variable',
    async (_event, owner: string, repo: string, name: string, value: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.updateVariable({
        ...normalizeRepository(owner, repo),
        name: String(name ?? '').trim(),
        value: String(value ?? ''),
      })
  )
  ipcMain.handle(
    'repository-settings:security-delete-variable',
    async (_event, owner: string, repo: string, name: string) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsSecurity.deleteVariable({
        ...normalizeRepository(owner, repo),
        name: String(name ?? '').trim(),
      })
  )
  ipcMain.handle('repository-settings:integrations-autolinks', async (_event, owner: string, repo: string) =>
    (await createAuthenticatedGitHubApi()).repositorySettingsIntegrations.listAutolinks(normalizeRepository(owner, repo))
  )
  ipcMain.handle(
    'repository-settings:integrations-create-autolink',
    async (_event, owner: string, repo: string, keyPrefix: string, urlTemplate: string, isAlphanumeric: boolean) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsIntegrations.createAutolink({
        ...normalizeRepository(owner, repo),
        keyPrefix: String(keyPrefix ?? '').trim(),
        urlTemplate: String(urlTemplate ?? '').trim(),
        isAlphanumeric: Boolean(isAlphanumeric),
      })
  )
  ipcMain.handle(
    'repository-settings:integrations-delete-autolink',
    async (_event, owner: string, repo: string, autolinkId: number) =>
      (await createAuthenticatedGitHubApi()).repositorySettingsIntegrations.deleteAutolink({
        ...normalizeRepository(owner, repo),
        autolinkId: Number(autolinkId),
      })
  )
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}

function normalizeRepository(owner: string, repo: string) {
  const normalizedOwner = String(owner ?? '').trim()
  const normalizedRepo = String(repo ?? '').trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
  }
}

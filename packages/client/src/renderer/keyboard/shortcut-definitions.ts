export type KeyboardShortcutCommandId =
  | 'settings.open'
  | 'workspace.search'
  | 'workspace.closeTab'
  | 'workspace.goBack'
  | 'workspace.goForward'
  | 'workspace.toggleSidebar'
  | 'workspace.toggleRightPanel'
  | 'workspace.toggleBookmark'
  | 'workspace.copyGitHubUrl'
  | 'repository.section.overview'
  | 'repository.section.files'
  | 'repository.section.commits'
  | 'repository.section.branches'
  | 'repository.section.pullRequests'
  | 'repository.section.issues'
  | 'repository.section.actions'
  | 'repository.section.releases'
  | 'repository.section.contributors'
  | 'repository.section.packages'
  | 'repository.section.deployments'
  | 'repository.section.settings'

export type KeyboardShortcutGroupId = 'global' | 'workspace' | 'repository'

export interface KeyboardShortcutDefinition {
  id: KeyboardShortcutCommandId
  group: KeyboardShortcutGroupId
  labelKey: string
  descriptionKey: string
  defaultAccelerator:
    | string
    | {
        mac: string
        other: string
      }
}

export const KEYBOARD_SHORTCUT_DEFINITIONS: readonly KeyboardShortcutDefinition[] = [
  {
    id: 'settings.open',
    group: 'global',
    labelKey: 'settings.keyboard.commands.settingsOpen.label',
    descriptionKey: 'settings.keyboard.commands.settingsOpen.description',
    defaultAccelerator: 'Primary+,',
  },
  {
    id: 'workspace.search',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceSearch.label',
    descriptionKey: 'settings.keyboard.commands.workspaceSearch.description',
    defaultAccelerator: 'Primary+K',
  },
  {
    id: 'workspace.closeTab',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceCloseTab.label',
    descriptionKey: 'settings.keyboard.commands.workspaceCloseTab.description',
    defaultAccelerator: 'Primary+W',
  },
  {
    id: 'workspace.goBack',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceGoBack.label',
    descriptionKey: 'settings.keyboard.commands.workspaceGoBack.description',
    defaultAccelerator: {
      mac: 'Primary+[',
      other: 'Alt+Left',
    },
  },
  {
    id: 'workspace.goForward',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceGoForward.label',
    descriptionKey: 'settings.keyboard.commands.workspaceGoForward.description',
    defaultAccelerator: {
      mac: 'Primary+]',
      other: 'Alt+Right',
    },
  },
  {
    id: 'workspace.toggleSidebar',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceToggleSidebar.label',
    descriptionKey: 'settings.keyboard.commands.workspaceToggleSidebar.description',
    defaultAccelerator: 'Primary+B',
  },
  {
    id: 'workspace.toggleRightPanel',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceToggleRightPanel.label',
    descriptionKey: 'settings.keyboard.commands.workspaceToggleRightPanel.description',
    defaultAccelerator: 'Primary+Shift+P',
  },
  {
    id: 'workspace.toggleBookmark',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceToggleBookmark.label',
    descriptionKey: 'settings.keyboard.commands.workspaceToggleBookmark.description',
    defaultAccelerator: 'Primary+D',
  },
  {
    id: 'workspace.copyGitHubUrl',
    group: 'workspace',
    labelKey: 'settings.keyboard.commands.workspaceCopyGitHubUrl.label',
    descriptionKey: 'settings.keyboard.commands.workspaceCopyGitHubUrl.description',
    defaultAccelerator: 'Primary+Shift+C',
  },
  {
    id: 'repository.section.overview',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionOverview.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionOverview.description',
    defaultAccelerator: '1',
  },
  {
    id: 'repository.section.files',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionFiles.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionFiles.description',
    defaultAccelerator: '2',
  },
  {
    id: 'repository.section.commits',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionCommits.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionCommits.description',
    defaultAccelerator: '3',
  },
  {
    id: 'repository.section.pullRequests',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionPullRequests.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionPullRequests.description',
    defaultAccelerator: '4',
  },
  {
    id: 'repository.section.issues',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionIssues.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionIssues.description',
    defaultAccelerator: '5',
  },
  {
    id: 'repository.section.actions',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionActions.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionActions.description',
    defaultAccelerator: '6',
  },
  {
    id: 'repository.section.releases',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionReleases.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionReleases.description',
    defaultAccelerator: '7',
  },
  {
    id: 'repository.section.contributors',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionContributors.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionContributors.description',
    defaultAccelerator: '0',
  },
  {
    id: 'repository.section.settings',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionSettings.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionSettings.description',
    defaultAccelerator: '8',
  },
  {
    id: 'repository.section.branches',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionBranches.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionBranches.description',
    defaultAccelerator: '9',
  },
  {
    id: 'repository.section.packages',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionPackages.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionPackages.description',
    // The digit row (0-9) is fully assigned to the other repository tabs; this
    // reserves an unused chord until the section shortcuts get renumbered.
    defaultAccelerator: 'Shift+P',
  },
  {
    id: 'repository.section.deployments',
    group: 'repository',
    labelKey: 'settings.keyboard.commands.repositorySectionDeployments.label',
    descriptionKey: 'settings.keyboard.commands.repositorySectionDeployments.description',
    // The digit row (0-9) is fully assigned to the other repository tabs; this
    // reserves an unused chord until the section shortcuts get renumbered.
    defaultAccelerator: 'Shift+D',
  },
]

export const KEYBOARD_SHORTCUT_GROUPS: readonly KeyboardShortcutGroupId[] = [
  'global',
  'workspace',
  'repository',
]

export const KEYBOARD_SHORTCUT_DEFINITION_BY_ID = new Map(
  KEYBOARD_SHORTCUT_DEFINITIONS.map((definition) => [definition.id, definition])
)

export function defaultAcceleratorForPlatform(
  definition: KeyboardShortcutDefinition,
  platform: ShortcutPlatform,
): string {
  if (typeof definition.defaultAccelerator === 'string') {
    return definition.defaultAccelerator
  }

  return platform.isMac ? definition.defaultAccelerator.mac : definition.defaultAccelerator.other
}

export interface ShortcutPlatform {
  isMac: boolean
}

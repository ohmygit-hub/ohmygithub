import type { FunctionalComponent } from 'vue'
import {
  AlarmClock,
  Bell,
  BookMarked,
  Bot,
  Building2,
  Code,
  Container,
  CreditCard,
  Globe,
  Heart,
  Hourglass,
  Info,
  Keyboard,
  KeyRound,
  LayoutGrid,
  Lock,
  Mail,
  MessageSquareText,
  MonitorSmartphone,
  Network,
  Palette,
  ScrollText,
  ShieldCheck,
  User,
  UserCog,
  UserX,
} from 'lucide-vue-next'

export type SettingsTabId =
  | 'appearance'
  | 'keyboard'
  | 'network'
  | 'about'
  | 'github-profile'
  | 'github-emails'
  | 'github-keys'
  | 'github-organizations'
  | 'github-blocked-users'
  | 'github-interaction-limits'
  | 'github-codespaces'
  | 'github-saved-replies'

type SettingsNavIcon = FunctionalComponent

export interface SettingsNavTab {
  kind: 'tab'
  id: SettingsTabId
  icon: SettingsNavIcon
  labelKey: string
}

export interface SettingsNavLink {
  kind: 'link'
  id: string
  icon: SettingsNavIcon
  labelKey: string
  url: string
}

export type SettingsNavItem = SettingsNavTab | SettingsNavLink

export interface SettingsNavGroup {
  id: string
  labelKey?: string
  items: SettingsNavItem[]
}

export const DEFAULT_SETTINGS_TAB: SettingsTabId = 'appearance'

const githubSettingsUrl = 'https://github.com/settings'

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'account',
    labelKey: 'settings.sections.account',
    items: [
      { kind: 'tab', id: 'github-profile', icon: User, labelKey: 'settings.tabs.github-profile' },
      { kind: 'link', id: 'account', icon: UserCog, labelKey: 'settings.links.account', url: `${githubSettingsUrl}/admin` },
      { kind: 'link', id: 'notifications', icon: Bell, labelKey: 'settings.links.notifications', url: `${githubSettingsUrl}/notifications` },
    ],
  },
  {
    id: 'interface',
    labelKey: 'settings.sections.interface',
    items: [
      { kind: 'tab', id: 'appearance', icon: Palette, labelKey: 'settings.tabs.appearance' },
      { kind: 'tab', id: 'keyboard', icon: Keyboard, labelKey: 'settings.tabs.keyboard' },
      { kind: 'tab', id: 'network', icon: Network, labelKey: 'settings.tabs.network' },
      { kind: 'tab', id: 'about', icon: Info, labelKey: 'settings.tabs.about' },
    ],
  },
  {
    id: 'access',
    labelKey: 'settings.sections.access',
    items: [
      { kind: 'link', id: 'billing', icon: CreditCard, labelKey: 'settings.links.billing', url: `${githubSettingsUrl}/billing` },
      { kind: 'tab', id: 'github-emails', icon: Mail, labelKey: 'settings.tabs.github-emails' },
      { kind: 'link', id: 'password-authentication', icon: Lock, labelKey: 'settings.links.passwordAuthentication', url: `${githubSettingsUrl}/security` },
      { kind: 'link', id: 'sessions', icon: MonitorSmartphone, labelKey: 'settings.links.sessions', url: `${githubSettingsUrl}/sessions` },
      { kind: 'tab', id: 'github-keys', icon: KeyRound, labelKey: 'settings.tabs.github-keys' },
      { kind: 'tab', id: 'github-organizations', icon: Building2, labelKey: 'settings.tabs.github-organizations' },
      { kind: 'tab', id: 'github-blocked-users', icon: UserX, labelKey: 'settings.tabs.github-blocked-users' },
      { kind: 'tab', id: 'github-interaction-limits', icon: Hourglass, labelKey: 'settings.tabs.github-interaction-limits' },
      { kind: 'link', id: 'code-review-limits', icon: ShieldCheck, labelKey: 'settings.links.codeReviewLimits', url: `${githubSettingsUrl}/code_review_limits` },
    ],
  },
  {
    id: 'code-automation',
    labelKey: 'settings.sections.codeAutomation',
    items: [
      { kind: 'link', id: 'repositories', icon: BookMarked, labelKey: 'settings.links.repositories', url: `${githubSettingsUrl}/repositories` },
      { kind: 'tab', id: 'github-codespaces', icon: Container, labelKey: 'settings.tabs.github-codespaces' },
      { kind: 'link', id: 'packages', icon: LayoutGrid, labelKey: 'settings.links.packages', url: `${githubSettingsUrl}/packages` },
      { kind: 'link', id: 'copilot', icon: Bot, labelKey: 'settings.links.copilot', url: `${githubSettingsUrl}/copilot` },
      { kind: 'link', id: 'pages', icon: Globe, labelKey: 'settings.links.pages', url: `${githubSettingsUrl}/pages` },
      { kind: 'tab', id: 'github-saved-replies', icon: MessageSquareText, labelKey: 'settings.tabs.github-saved-replies' },
    ],
  },
  {
    id: 'security',
    labelKey: 'settings.sections.security',
    items: [
      { kind: 'link', id: 'code-security', icon: ShieldCheck, labelKey: 'settings.links.codeSecurity', url: `${githubSettingsUrl}/security_analysis` },
    ],
  },
  {
    id: 'integrations',
    labelKey: 'settings.sections.integrations',
    items: [
      { kind: 'link', id: 'applications', icon: LayoutGrid, labelKey: 'settings.links.applications', url: `${githubSettingsUrl}/installations` },
      { kind: 'link', id: 'scheduled-reminders', icon: AlarmClock, labelKey: 'settings.links.scheduledReminders', url: `${githubSettingsUrl}/reminders` },
    ],
  },
  {
    id: 'archives',
    labelKey: 'settings.sections.archives',
    items: [
      { kind: 'link', id: 'security-log', icon: ScrollText, labelKey: 'settings.links.securityLog', url: `${githubSettingsUrl}/security-log` },
      { kind: 'link', id: 'sponsorship-log', icon: Heart, labelKey: 'settings.links.sponsorshipLog', url: `${githubSettingsUrl}/sponsors-log` },
    ],
  },
  {
    id: 'developer',
    items: [
      { kind: 'link', id: 'developer-settings', icon: Code, labelKey: 'settings.links.developerSettings', url: `${githubSettingsUrl}/apps` },
    ],
  },
]

export const GITHUB_SETTINGS_TAB_IDS = new Set<SettingsTabId>(
  SETTINGS_NAV_GROUPS
    .filter((group) => group.id !== 'interface')
    .flatMap((group) => group.items)
    .filter((item): item is SettingsNavTab => item.kind === 'tab')
    .map((item) => item.id),
)

export const SETTINGS_TAB_IDS = new Set<string>(
  SETTINGS_NAV_GROUPS
    .flatMap((group) => group.items)
    .filter((item): item is SettingsNavTab => item.kind === 'tab')
    .map((item) => item.id),
)

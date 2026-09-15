import type { GorgDropdownItem } from '~/components/nav/nav'
import type { GorgNavItem } from '~/components/shell/shell'

/**
 * The application's navigation, shared by every shell.
 *
 * All four shells take the same `items` shape and the same slot contract, so
 * this lives in one place — otherwise each layout would carry its own copy and
 * they would drift apart the first time a route changed.
 */
export const appNav: GorgNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'lucide:layout-dashboard',
    children: [
      { label: 'Dashboard', icon: 'lucide:gauge', to: '/', exact: true },
      { label: 'Charts', icon: 'lucide:chart-line', to: '/charts' },
    ],
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: 'lucide:chart-pie',
    children: [
      { label: 'Analytics', icon: 'lucide:chart-area', to: '/dashboards/analytics' },
      { label: 'Sales', icon: 'lucide:trending-up', to: '/dashboards/sales' },
      { label: 'Ecommerce', icon: 'lucide:shopping-cart', to: '/dashboards/ecommerce' },
      { label: 'Banking', icon: 'lucide:landmark', to: '/dashboards/banking' },
      { label: 'Project', icon: 'lucide:kanban', to: '/dashboards/project' },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    icon: 'lucide:briefcase',
    children: [
      { label: 'Inbox', icon: 'lucide:inbox', to: '/inbox', badge: 2 },
      { label: 'Tasks', icon: 'lucide:square-check-big', to: '/tasks' },
      { label: 'Onboarding', icon: 'lucide:list-checks', to: '/wizard' },
    ],
  },
  {
    id: 'layouts',
    label: 'Layouts',
    icon: 'lucide:layout-template',
    children: [
      // The index self-discovers every /layouts/* route, so this stays one entry.
      { label: 'All archetypes', icon: 'lucide:layout-template', to: '/layouts', exact: true },
      { label: 'Calendar', icon: 'lucide:calendar', to: '/layouts/calendar' },
      { label: 'Notifications', icon: 'lucide:bell', to: '/layouts/notifications' },
      { label: 'Files', icon: 'lucide:folder', to: '/layouts/file-manager' },
      { label: 'Search', icon: 'lucide:search', to: '/layouts/search' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: 'lucide:users',
    children: [
      { label: 'Members', icon: 'lucide:user', to: '/members' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'lucide:settings',
    children: [
      { label: 'Preferences', icon: 'lucide:sliders-horizontal', to: '/settings' },
    ],
  },
]

export const accountMenu: GorgDropdownItem[] = [
  { label: 'Profile', icon: 'lucide:user', to: '/settings' },
  { label: 'Preferences', icon: 'lucide:sliders-horizontal', to: '/settings', shortcut: '⌘,' },
  {
    label: 'Workspaces',
    icon: 'lucide:building-2',
    children: [
      { label: 'Acme core', to: '/' },
      { label: 'Field ops', to: '/' },
    ],
  },
  { separator: true },
  { label: 'Lock screen', icon: 'lucide:lock', to: '/auth/locked' },
  { label: 'Sign out', icon: 'lucide:log-out', to: '/auth/login', destructive: true },
]

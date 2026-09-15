import type { GorgDropdownItem } from '~/components/nav/nav'

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

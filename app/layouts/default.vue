<script setup lang="ts">
import type { GorgBreadcrumbItem, GorgDropdownItem } from '~/components/nav/nav'
import type { GorgNavItem } from '~/components/shell/shell'

/** Sample tree — swap it out per app; every gorg shell takes the same shape. */
const nav: GorgNavItem[] = [
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

const account: GorgDropdownItem[] = [
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

const route = useRoute()
const router = useRouter()

/**
 * A path segment is only a link if a real route exists for it — otherwise an
 * intermediate directory like /dashboards renders a crumb that 404s.
 * Checked against the route table rather than `router.resolve()`, because
 * resolve() logs its own "No match found" warning for every miss.
 */
const staticPaths = computed(() => new Set(
  router.getRoutes().map(r => r.path).filter(p => !p.includes(':')),
))

function routable(path: string) {
  return staticPaths.value.has(path)
}

const crumbs = computed<GorgBreadcrumbItem[]>(() => {
  const segments = route.path.split('/').filter(Boolean)
  const trail: GorgBreadcrumbItem[] = [{ label: 'Home', to: '/', icon: 'lucide:house' }]
  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    trail.push({
      label: segment.replace(/-/g, ' ').replace(/^./, character => character.toUpperCase()),
      to: routable(path) ? path : undefined,
    })
  }
  return trail
})
</script>

<template>
  <GorgSidenavLayout :items="nav" title="gorg" subtitle="Admin kit">
    <template #toolbar>
      <GorgBreadcrumb :items="crumbs" :max="4" class="hidden sm:block" />

      <div class="ml-auto flex items-center gap-1">
        <GorgThemeToggle />

        <GorgDropdown :items="account" heading="Account">
          <template #trigger>
            <button
              type="button"
              aria-label="Account menu"
              class="grid size-9 place-items-center rounded-pill bg-tide-100 text-sm font-semibold text-tide-800
                     transition-[background-color,transform] duration-(--duration-snap) hover:bg-tide-200 active:scale-[0.96]
                     dark:bg-tide-900/50 dark:text-tide-100 dark:hover:bg-tide-900"
            >
              GO
            </button>
          </template>
        </GorgDropdown>
      </div>
    </template>

    <template #footer>
      <GorgSidenavRailItem label="Help & docs" icon="lucide:life-buoy" />
    </template>

    <slot />
  </GorgSidenavLayout>
</template>

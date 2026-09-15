import type { GorgNavItem } from '~/components/shell/shell'

/**
 * Curated label and icon per route. A route missing from this map still appears
 * in the nav — it just falls back to a title-cased slug and a generic icon —
 * because a page that renders but cannot be reached is the worse failure.
 */
const META: Record<string, { label: string, icon: string }> = {
  '/dashboards/analytics': { label: 'Analytics', icon: 'lucide:chart-area' },
  '/dashboards/sales': { label: 'Sales', icon: 'lucide:trending-up' },
  '/dashboards/ecommerce': { label: 'Ecommerce', icon: 'lucide:shopping-cart' },
  '/dashboards/banking': { label: 'Banking', icon: 'lucide:landmark' },
  '/dashboards/project': { label: 'Project', icon: 'lucide:kanban' },
  '/dashboards/company': { label: 'Company', icon: 'lucide:building-2' },
  '/dashboards/human-resources': { label: 'People ops', icon: 'lucide:users-round' },
  '/dashboards/delivery': { label: 'Delivery', icon: 'lucide:truck' },
  '/dashboards/stocks': { label: 'Stocks', icon: 'lucide:candlestick-chart' },
  '/dashboards/course': { label: 'Courses', icon: 'lucide:graduation-cap' },
  '/dashboards/health': { label: 'Health', icon: 'lucide:heart-pulse' },
  '/dashboards/messaging': { label: 'Messaging', icon: 'lucide:messages-square' },
  '/dashboards/jobs': { label: 'Jobs', icon: 'lucide:briefcase-business' },
  '/dashboards/writer': { label: 'Writer', icon: 'lucide:pen-line' },
  '/dashboards/influencer': { label: 'Influencer', icon: 'lucide:megaphone' },
  '/dashboards/video': { label: 'Video', icon: 'lucide:clapperboard' },
  '/dashboards/flights': { label: 'Flights', icon: 'lucide:plane' },

  '/starters/sidebar': { label: 'Sidebar shell', icon: 'lucide:panel-left' },
  '/starters/topnav': { label: 'Topnav shell', icon: 'lucide:panel-top' },
  '/starters/collapse': { label: 'Collapse shell', icon: 'lucide:panel-left-close' },
  '/starters/blank': { label: 'Blank page', icon: 'lucide:file' },
}

function titleCase(slug: string) {
  return slug.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
}

/**
 * Navigation for every shell.
 *
 * The dashboards and starters sections are DERIVED from the route table rather
 * than hand-listed. Six dashboards and four starters had already shipped
 * unreachable because the hand-written list drifted behind the pages; deriving
 * makes that impossible.
 */
export function useAppNav() {
  const router = useRouter()

  const derive = (prefix: string, fallbackIcon: string) => computed(() =>
    router.getRoutes()
      .map(r => r.path)
      .filter(p => p.startsWith(`${prefix}/`) && !p.includes(':'))
      .filter((p, i, a) => a.indexOf(p) === i)
      .sort()
      .map(path => ({
        label: META[path]?.label ?? titleCase(path.slice(prefix.length + 1)),
        icon: META[path]?.icon ?? fallbackIcon,
        to: path,
      })))

  const dashboards = derive('/dashboards', 'lucide:chart-pie')
  const starters = derive('/starters', 'lucide:file')

  return computed<GorgNavItem[]>(() => [
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
      children: dashboards.value,
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
      id: 'starters',
      label: 'Starters',
      icon: 'lucide:file-plus',
      children: starters.value,
    },
    {
      id: 'people',
      label: 'People',
      icon: 'lucide:users',
      children: [{ label: 'Members', icon: 'lucide:user', to: '/members' }],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'lucide:settings',
      children: [{ label: 'Preferences', icon: 'lucide:sliders-horizontal', to: '/settings' }],
    },
  ])
}

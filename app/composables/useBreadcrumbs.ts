import type { GorgBreadcrumbItem } from '~/components/nav/nav'

/**
 * Route-derived breadcrumbs, shared by every shell layout.
 *
 * A segment only becomes a link when a real route exists for it — otherwise an
 * intermediate directory like /dashboards renders a crumb that 404s. Membership
 * is tested against the route table rather than `router.resolve()`, because
 * resolve() logs its own "No match found" warning for every miss.
 */
export function useBreadcrumbs() {
  const route = useRoute()
  const router = useRouter()

  const staticPaths = computed(() => new Set(
    router.getRoutes().map(r => r.path).filter(p => !p.includes(':')),
  ))

  return computed<GorgBreadcrumbItem[]>(() => {
    const segments = route.path.split('/').filter(Boolean)
    const trail: GorgBreadcrumbItem[] = [{ label: 'Home', to: '/', icon: 'lucide:house' }]
    let path = ''
    for (const segment of segments) {
      path += `/${segment}`
      trail.push({
        label: segment.replace(/-/g, ' ').replace(/^./, character => character.toUpperCase()),
        to: staticPaths.value.has(path) ? path : undefined,
      })
    }
    return trail
  })
}

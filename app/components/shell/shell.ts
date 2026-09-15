import type { InjectionKey, MaybeRefOrGetter, Ref } from 'vue'
import { useRoute } from '#app'
import { onKeyStroke, useScrollLock } from '@vueuse/core'
import { gsap } from 'gsap'
import { computed, inject, nextTick, onScopeDispose, provide, ref, toValue, watch } from 'vue'

/**
 * One nav entry, shared by every gorg shell. A node with `children` renders as
 * a group (sidebar/collapse) or as a secondary panel (sidenav); a node with
 * `to` renders as a link; a node with neither is a plain button.
 */
export interface GorgNavItem {
  /** stable identity — falls back to `to`, then `label` */
  id?: string
  label: string
  icon?: string
  to?: string
  /** match the route exactly instead of by prefix */
  exact?: boolean
  badge?: string | number
  disabled?: boolean
  children?: GorgNavItem[]
}

/** Shell state every nav piece can reach, whatever archetype wraps it. */
export interface GorgShellContext {
  /** the vertical nav is showing as an overlay (below `lg`) */
  mobileOpen: Ref<boolean>
  /** the vertical nav is reduced to icons (collapse shell) */
  collapsed: Ref<boolean>
  setMobileOpen: (value: boolean) => void
  setCollapsed: (value: boolean) => void
  toggleMobile: () => void
  toggleCollapsed: () => void
}

export const gorgShellKey: InjectionKey<GorgShellContext> = Symbol('gorg-shell')

export function provideShellContext(ctx: GorgShellContext): GorgShellContext {
  provide(gorgShellKey, ctx)
  return ctx
}

/**
 * Read the surrounding shell. Used outside one, a nav piece still works — it
 * just drives a private copy of the state instead of the shell's.
 */
export function useShellContext(): GorgShellContext {
  const injected = inject(gorgShellKey, null)
  if (injected)
    return injected

  const mobileOpen = ref(false)
  const collapsed = ref(false)

  return {
    mobileOpen,
    collapsed,
    setMobileOpen: (value) => { mobileOpen.value = value },
    setCollapsed: (value) => { collapsed.value = value },
    toggleMobile: () => { mobileOpen.value = !mobileOpen.value },
    toggleCollapsed: () => { collapsed.value = !collapsed.value },
  }
}

function normalisePath(path: string): string {
  const clean = (path.split('?')[0] ?? '').split('#')[0] ?? ''
  const trimmed = clean.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/** Exact or prefix match between the current route and a link target. */
export function isPathActive(current: string, target?: string, exact = false): boolean {
  if (!target)
    return false
  const here = normalisePath(current)
  const there = normalisePath(target)
  if (exact || there === '/')
    return here === there
  return here === there || here.startsWith(`${there}/`)
}

/** True when the item itself or anything below it matches the route. */
export function isBranchActive(current: string, item: GorgNavItem): boolean {
  if (isPathActive(current, item.to, item.exact))
    return true
  return item.children?.some(child => isBranchActive(current, child)) ?? false
}

export function navItemKey(item: GorgNavItem, index: number): string {
  return item.id ?? item.to ?? `${item.label}-${index}`
}

/** Reactive active state for a single link target. */
export function useNavActive(
  to: MaybeRefOrGetter<string | undefined>,
  exact?: MaybeRefOrGetter<boolean | undefined>,
) {
  const route = useRoute()
  return computed(() => isPathActive(route.path, toValue(to), toValue(exact) ?? false))
}

/** Reactive active state for a whole branch of the tree. */
export function useBranchActive(item: MaybeRefOrGetter<GorgNavItem>) {
  const route = useRoute()
  return computed(() => isBranchActive(route.path, toValue(item)))
}

/**
 * Overlay behaviour shared by every shell: body scroll locks while the nav is
 * open, Escape dismisses it, and a route change hands the screen back.
 */
export function useShellOverlay(): Ref<boolean> {
  const mobileOpen = ref(false)
  const route = useRoute()
  const locked = useScrollLock(import.meta.client ? document.body : null)

  watch(mobileOpen, (value) => { locked.value = value })
  watch(() => route.path, () => { mobileOpen.value = false })

  onKeyStroke('Escape', () => {
    if (mobileOpen.value)
      mobileOpen.value = false
  })

  onScopeDispose(() => { locked.value = false })

  return mobileOpen
}

/**
 * Height animation for a Reka Collapsible whose content is force-mounted.
 * Reka only unmounts on CSS *animations*, and gorg ships no keyframes, so the
 * panel stays mounted (inert while shut) and GSAP owns the open/close.
 */
export function useCollapseMotion(open: Ref<boolean>) {
  const contentEl = ref<HTMLElement | null>(null)
  const folded = ref(!open.value)

  watch(open, async (value) => {
    await nextTick()
    const el = contentEl.value
    if (!el) {
      folded.value = !value
      return
    }

    gsap.killTweensOf(el)

    if (value) {
      folded.value = false
      await nextTick()
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.28, ease: 'power3.out', clearProps: 'height,opacity' },
      )
    }
    else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          folded.value = true
          gsap.set(el, { clearProps: 'height,opacity' })
        },
      })
    }
  })

  return { contentEl, folded }
}

/** Fade + rise a nav list's children once, on mount. */
export function staggerNav(el: HTMLElement | null | undefined, x = -8) {
  if (!el || !import.meta.client)
    return
  const children = Array.from(el.children)
  if (!children.length)
    return
  gsap.from(children, {
    opacity: 0,
    x,
    duration: 0.34,
    stagger: 0.035,
    ease: 'power3.out',
    clearProps: 'opacity,transform',
  })
}

export const contentWidths = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-none',
} as const

export type GorgContentWidth = keyof typeof contentWidths

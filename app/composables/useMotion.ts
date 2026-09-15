import type { Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type MaybeEl = Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined

function resolve(target: MaybeEl): HTMLElement | null {
  const raw = target && 'value' in (target as any) ? (target as Ref).value : target
  // A `ref` used inside v-for resolves to an array. Take the first entry rather
  // than blind-casting — calling querySelectorAll on an array throws and takes
  // the whole page down with it.
  const el = Array.isArray(raw) ? raw[0] : raw
  return el instanceof HTMLElement ? el : null
}

/**
 * Fade + rise an element into view once it crosses the viewport.
 * Pairs with the `js-reveal` class, which pre-hides the element so there
 * is no flash before GSAP takes over.
 */
export function useReveal(target: MaybeEl, opts: {
  y?: number
  delay?: number
  duration?: number
  start?: string
} = {}) {
  const { y = 24, delay = 0, duration = 0.6, start = 'top 85%' } = opts

  onMounted(() => {
    const el = resolve(target)
    if (!el)
      return

    const tween = gsap.fromTo(el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        // Without this, GSAP stamps opacity:0 the moment the tween is built and
        // only clears it when the trigger fires — so a trigger that never fires
        // (mis-measured, JS stalled, element never scrolled to) leaves the
        // content permanently invisible. Deferring the from-state means the
        // worst case is "no animation", never "no content".
        immediateRender: false,
        onStart: () => el.classList.add('is-revealed'),
        scrollTrigger: { trigger: el, start, once: true },
      },
    )

    onScopeDispose(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  })
}

/** Stagger direct children into view — lists, card grids, table rows. */
export function useStagger(target: MaybeEl, opts: {
  selector?: string
  each?: number
  y?: number
  start?: string
} = {}) {
  const { selector = ':scope > *', each = 0.06, y = 18, start = 'top 85%' } = opts

  onMounted(() => {
    const el = resolve(target)
    if (!el)
      return

    const children = el.querySelectorAll(selector)
    if (!children.length)
      return

    const tween = gsap.fromTo(children,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: each,
        immediateRender: false, // see note in useReveal
        scrollTrigger: { trigger: el, start, once: true },
      },
    )

    onScopeDispose(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  })
}

/** Animate a number from 0 to its value — stat tiles, KPI counters. */
export function useCounter(value: Ref<number> | number, opts: {
  duration?: number
  decimals?: number
} = {}) {
  const { duration = 1.2, decimals = 0 } = opts
  const target = computed(() => (typeof value === 'number' ? value : value.value))
  const display = ref(0)

  const run = () => {
    const proxy = { n: display.value }
    gsap.to(proxy, {
      n: target.value,
      duration,
      ease: 'power2.out',
      onUpdate: () => { display.value = Number(proxy.n.toFixed(decimals)) },
    })
  }

  onMounted(run)
  watch(target, run)

  return { display }
}

/** Re-measure ScrollTriggers after layout-shifting work (route change, data load). */
export function refreshMotion() {
  if (import.meta.client)
    ScrollTrigger.refresh()
}

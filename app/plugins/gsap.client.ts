import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger, Flip)

  // Honour the OS setting once, globally, rather than at every call site.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced)
    gsap.globalTimeline.timeScale(1000)

  gsap.defaults({ ease: 'power3.out', duration: 0.42 })

  const root = document.documentElement
  root.classList.add('gsap-armed')

  // Safety net: if a ScrollTrigger mis-measures or never fires, reveal anything
  // still hidden rather than leaving the page with holes in it.
  const sweep = () => root.querySelectorAll('.js-reveal:not(.is-revealed)')
    .forEach(el => el.classList.add('is-revealed'))

  if (reduced)
    sweep()
  else
    window.setTimeout(sweep, 4000)

  return {
    provide: { gsap, ScrollTrigger, Flip, reducedMotion: reduced },
  }
})

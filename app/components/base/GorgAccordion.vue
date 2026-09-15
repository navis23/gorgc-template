<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'

interface GorgAccordionItem {
  /** stable, unique key — also the name of this item's content slot */
  value: string
  title: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  /** plain-text fallback when no slot is supplied for this value */
  content?: string
}

type Variant = 'bordered' | 'separated' | 'flush'

const props = withDefaults(defineProps<{
  items?: GorgAccordionItem[]
  type?: 'single' | 'multiple'
  collapsible?: boolean
  variant?: Variant
}>(), {
  items: () => [],
  type: 'single',
  collapsible: true,
  variant: 'bordered',
})

const model = defineModel<string | string[] | undefined>()

const roots: Record<Variant, string> = {
  bordered: 'surface-card overflow-hidden',
  separated: 'flex flex-col gap-2',
  flush: 'border-y border-[var(--surface-border)]',
}

const rows: Record<Variant, string> = {
  bordered: 'border-b border-[var(--surface-border)] last:border-b-0',
  separated: 'surface-card overflow-hidden',
  flush: 'border-b border-[var(--surface-border)] last:border-b-0',
}

const openValues = computed(() => {
  const value = model.value
  if (value === undefined || value === null)
    return new Set<string>()
  return new Set(Array.isArray(value) ? value : [value])
})

function isOpen(value: string) {
  return openValues.value.has(value)
}

/**
 * Reka's `Presence` only defers unmount for CSS *keyframe* animations, and gorg
 * ships none, so every panel stays mounted — `inert` + `aria-hidden` while shut
 * — and GSAP owns the height. `folded` is what collapses a settled panel to
 * zero; it is derived from the model until a tween has an opinion, so the
 * server and the first client render agree.
 */
const folded = reactive(new Map<string, boolean>())
const panels = new Map<string, HTMLElement>()

function isFolded(value: string) {
  const settled = folded.get(value)
  return settled === undefined ? !isOpen(value) : settled
}

function setPanel(value: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement)
    panels.set(value, el)
  else
    panels.delete(value)
}

async function animate(value: string, opening: boolean) {
  await nextTick()
  const el = panels.get(value)
  if (!el) {
    folded.set(value, !opening)
    return
  }

  gsap.killTweensOf(el)

  if (opening) {
    folded.set(value, false)
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
        folded.set(value, true)
        gsap.set(el, { clearProps: 'height,opacity' })
      },
    })
  }
}

watch(openValues, (next, previous) => {
  if (!import.meta.client)
    return
  for (const item of props.items) {
    const nowOpen = next.has(item.value)
    if (nowOpen === (previous?.has(item.value) ?? nowOpen))
      continue
    void animate(item.value, nowOpen)
  }
})
</script>

<template>
  <AccordionRoot
    v-model="model"
    :type="type"
    :collapsible="collapsible"
    :unmount-on-hide="false"
    :class="roots[variant]"
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      :class="rows[variant]"
    >
      <AccordionHeader as="h3" class="flex">
        <AccordionTrigger
          class="group flex w-full items-center gap-3 px-4 py-3.5 text-start text-sm font-medium
                 text-[var(--text-strong)] transition-[background-color,color] duration-(--duration-snap)
                 hover:bg-[var(--surface-sunken)]
                 data-disabled:pointer-events-none data-disabled:opacity-50"
        >
          <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0 text-[var(--text-muted)]" />

          <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>

          <span
            v-if="item.badge !== undefined && item.badge !== ''"
            class="shrink-0 rounded-pill bg-ember-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold
                   text-ember-800 dark:bg-ember-950 dark:text-ember-100"
          >{{ item.badge }}</span>

          <Icon
            name="lucide:chevron-down"
            class="size-4 shrink-0 text-[var(--text-muted)] transition-transform
                   duration-(--duration-base) ease-(--ease-entrance) group-data-[state=open]:rotate-180"
          />
        </AccordionTrigger>
      </AccordionHeader>

      <AccordionContent
        force-mount
        class="overflow-hidden"
        :inert="!isOpen(item.value) || undefined"
        :aria-hidden="!isOpen(item.value) || undefined"
      >
        <div
          :ref="el => setPanel(item.value, el)"
          class="overflow-hidden"
          :class="isFolded(item.value) && 'h-0 opacity-0'"
        >
          <div class="px-4 pb-4 text-sm text-[var(--text-muted)]">
            <slot :name="item.value" :item="item" :open="isOpen(item.value)">
              {{ item.content }}
            </slot>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

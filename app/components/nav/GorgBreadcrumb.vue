<script setup lang="ts">
import type { GorgBreadcrumbItem, GorgDropdownItem } from './nav'

interface Crumb {
  item: GorgBreadcrumbItem
  last: boolean
}

const props = withDefaults(defineProps<{
  items?: GorgBreadcrumbItem[]
  /** how many crumbs may show before the middle folds behind an ellipsis */
  max?: number
  separator?: string
}>(), {
  items: () => [],
  max: 4,
  separator: 'lucide:chevron-right',
})

const limit = computed(() => Math.max(3, props.max))
const overflowing = computed(() => props.items.length > limit.value)

const leading = computed<Crumb[]>(() => {
  const source = overflowing.value ? props.items.slice(0, 1) : props.items
  return source.map((item, index) => ({ item, last: !overflowing.value && index === props.items.length - 1 }))
})

const trailing = computed<Crumb[]>(() => {
  if (!overflowing.value)
    return []
  const source = props.items.slice(props.items.length - (limit.value - 2))
  return source.map((item, index) => ({ item, last: index === source.length - 1 }))
})

const folded = computed<GorgDropdownItem[]>(() => {
  if (!overflowing.value)
    return []
  return props.items
    .slice(1, props.items.length - (limit.value - 2))
    .map(item => ({ label: item.label, icon: item.icon, to: item.to }))
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol class="flex flex-wrap items-center gap-1 text-sm">
      <li v-for="(crumb, index) in leading" :key="`lead-${index}`" class="flex min-w-0 items-center gap-1">
        <Icon
          v-if="index > 0"
          :name="separator"
          class="size-3.5 shrink-0 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <NuxtLink
          v-if="crumb.item.to && !crumb.last"
          :to="crumb.item.to"
          class="flex min-w-0 items-center gap-1.5 rounded-field px-1.5 py-1 text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        >
          <Icon v-if="crumb.item.icon" :name="crumb.item.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ crumb.item.label }}</span>
        </NuxtLink>
        <span
          v-else
          :aria-current="crumb.last ? 'page' : undefined"
          class="flex min-w-0 items-center gap-1.5 px-1.5 py-1 font-medium text-[var(--text-strong)]"
        >
          <Icon v-if="crumb.item.icon" :name="crumb.item.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ crumb.item.label }}</span>
        </span>
      </li>

      <li v-if="overflowing" class="flex items-center gap-1">
        <Icon :name="separator" class="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <GorgDropdown :items="folded" align="start" heading="Skipped">
          <template #trigger>
            <button
              type="button"
              aria-label="Show hidden breadcrumbs"
              class="grid size-7 place-items-center rounded-field text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <Icon name="lucide:ellipsis" class="size-4" />
            </button>
          </template>
        </GorgDropdown>
      </li>

      <li v-for="(crumb, index) in trailing" :key="`tail-${index}`" class="flex min-w-0 items-center gap-1">
        <Icon :name="separator" class="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <NuxtLink
          v-if="crumb.item.to && !crumb.last"
          :to="crumb.item.to"
          class="flex min-w-0 items-center gap-1.5 rounded-field px-1.5 py-1 text-[var(--text-muted)] transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        >
          <Icon v-if="crumb.item.icon" :name="crumb.item.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ crumb.item.label }}</span>
        </NuxtLink>
        <span
          v-else
          :aria-current="crumb.last ? 'page' : undefined"
          class="flex min-w-0 items-center gap-1.5 px-1.5 py-1 font-medium text-[var(--text-strong)]"
        >
          <Icon v-if="crumb.item.icon" :name="crumb.item.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ crumb.item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

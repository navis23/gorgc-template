<script setup lang="ts">
import type { GorgTabItem } from './nav'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

type Variant = 'underline' | 'pill' | 'enclosed'

const props = withDefaults(defineProps<{
  items?: GorgTabItem[]
  variant?: Variant
  size?: 'sm' | 'md'
  /** share the row equally between triggers */
  grow?: boolean
  ariaLabel?: string
}>(), {
  items: () => [],
  variant: 'underline',
  size: 'md',
  ariaLabel: 'Tabs',
})

const model = defineModel<string>({ default: '' })

const first = props.items[0]
if (!model.value && first)
  model.value = first.value

const lists: Record<Variant, string> = {
  underline: 'gap-1 border-b border-[var(--surface-border)]',
  pill: 'gap-1 rounded-pill bg-[var(--surface-sunken)] p-1',
  enclosed: 'gap-1 border-b border-[var(--surface-border)]',
}

const triggers: Record<Variant, string> = {
  underline: 'text-[var(--text-muted)] hover:text-[var(--text-strong)] data-[state=active]:text-tide-700 dark:data-[state=active]:text-tide-200',
  pill: 'rounded-pill text-[var(--text-muted)] hover:text-[var(--text-strong)] data-[state=active]:text-[var(--text-strong)]',
  enclosed: '-mb-px rounded-t-field border border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)] data-[state=active]:border-[var(--surface-border)] data-[state=active]:border-b-[var(--surface-raised)] data-[state=active]:bg-[var(--surface-raised)] data-[state=active]:text-[var(--text-strong)]',
}

const indicators: Record<Variant, string> = {
  underline: 'absolute bottom-0 left-0 z-0 h-0.5 rounded-pill bg-tide-600',
  pill: 'absolute inset-y-1 left-0 z-0 rounded-pill bg-[var(--surface-raised)] shadow-raise',
  enclosed: '',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
} as const

const hasIndicator = computed(() => props.variant !== 'enclosed')
</script>

<template>
  <TabsRoot v-model="model" class="w-full">
    <TabsList
      :aria-label="ariaLabel"
      class="relative flex items-center"
      :class="[lists[variant], grow && 'w-full']"
    >
      <TabsIndicator
        v-if="hasIndicator"
        class="w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)
               transition-[width,transform] duration-(--duration-base) ease-(--ease-entrance)"
        :class="indicators[variant]"
      />

      <TabsTrigger
        v-for="tab in items"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        class="relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium
               outline-offset-2 transition-colors duration-(--duration-snap)
               disabled:pointer-events-none disabled:opacity-40"
        :class="[sizes[size], triggers[variant], grow && 'flex-1']"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="size-4 shrink-0" />
        <span class="truncate">{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined && tab.badge !== ''"
          class="rounded-pill bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[0.6875rem] font-semibold text-[var(--text-muted)]"
        >{{ tab.badge }}</span>
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="tab in items"
      :key="tab.value"
      :value="tab.value"
      class="mt-4 focus-visible:outline-none"
    >
      <slot :name="tab.value" :tab="tab" />
    </TabsContent>

    <slot />
  </TabsRoot>
</template>

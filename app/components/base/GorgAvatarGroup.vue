<script setup lang="ts">
interface Person { name: string, src?: string }

const props = withDefaults(defineProps<{
  people: Person[]
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), { max: 4, size: 'sm' })

const shown = computed(() => props.people.slice(0, props.max))
const overflow = computed(() => Math.max(0, props.people.length - props.max))

const ringSizes = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base' }
</script>

<template>
  <div class="flex items-center -space-x-2">
    <GorgTooltip v-for="p in shown" :key="p.name" :text="p.name">
      <span class="rounded-pill ring-2 ring-[var(--surface-raised)]">
        <GorgAvatar :name="p.name" :src="p.src" :size="size" />
      </span>
    </GorgTooltip>

    <span
      v-if="overflow"
      class="inline-grid place-items-center rounded-pill bg-[var(--surface-sunken)] font-medium text-[var(--text-muted)] ring-2 ring-[var(--surface-raised)]"
      :class="ringSizes[size]"
    >+{{ overflow }}</span>
  </div>
</template>

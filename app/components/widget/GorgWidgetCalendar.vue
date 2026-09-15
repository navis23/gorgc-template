<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  /** ISO dates (YYYY-MM-DD) to mark. */
  marked?: string[]
  month?: number
  year?: number
}>(), { marked: () => [] })

const today = new Date(2026, 8, 15) // stable for SSR; swap for new Date() in an app
const cursor = ref(new Date(props.year ?? today.getFullYear(), props.month ?? today.getMonth(), 1))

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const grid = computed(() => {
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const days = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday-first
  const cells: Array<{ day: number | null, iso?: string }> = []
  for (let i = 0; i < lead; i++) cells.push({ day: null })
  for (let d = 1; d <= days; d++) {
    const iso = `${cursor.value.getFullYear()}-${String(cursor.value.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso })
  }
  return cells
})

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

const isToday = (iso?: string) =>
  iso === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const shift = (n: number) => {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + n, 1)
}
</script>

<template>
  <GorgCard>
    <template v-if="title" #title>{{ title }}</template>

    <div class="mb-3 flex items-center justify-between">
      <GorgButton variant="ghost" size="xs" aria-label="Previous month" @click="shift(-1)">
        <Icon name="lucide:chevron-left" class="size-4" />
      </GorgButton>
      <p class="text-sm font-medium text-[var(--text-strong)]">{{ monthLabel }}</p>
      <GorgButton variant="ghost" size="xs" aria-label="Next month" @click="shift(1)">
        <Icon name="lucide:chevron-right" class="size-4" />
      </GorgButton>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center">
      <abbr
        v-for="(d, i) in WEEK" :key="i"
        class="py-1 text-[10px] font-medium text-[var(--text-muted)] no-underline"
      >{{ d }}</abbr>

      <div
        v-for="(c, i) in grid" :key="i"
        class="grid aspect-square place-items-center rounded-field text-xs"
        :class="[
          c.day === null && 'invisible',
          isToday(c.iso) && 'bg-tide-600 font-semibold text-white',
          !isToday(c.iso) && marked.includes(c.iso ?? '') && 'bg-tide-100 font-medium text-tide-800 dark:bg-tide-900/50 dark:text-tide-200',
          !isToday(c.iso) && !marked.includes(c.iso ?? '') && 'text-[var(--text-muted)]',
        ]"
      >{{ c.day }}</div>
    </div>
  </GorgCard>
</template>

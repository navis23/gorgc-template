<script setup lang="ts">
import type { ThemeMode } from '~/composables/useTheme'

withDefaults(defineProps<{
  /** show the mode name beside the glyph */
  labelled?: boolean
}>(), {
  labelled: false,
})

const { mode, set } = useTheme()

const order: ThemeMode[] = ['light', 'dark', 'system']

const icons: Record<ThemeMode, string> = {
  light: 'lucide:sun',
  dark: 'lucide:moon',
  system: 'lucide:monitor',
}

const names: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

const next = computed(() => order[(order.indexOf(mode.value) + 1) % order.length] ?? 'light')

function cycle() {
  set(next.value)
}
</script>

<template>
  <button
    type="button"
    :aria-label="`Theme: ${names[mode]}. Switch to ${names[next]}`"
    :title="`Theme: ${names[mode]}`"
    class="inline-flex h-9 items-center gap-2 rounded-field text-[var(--text-muted)]
           transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
    :class="labelled ? 'px-3 text-sm font-medium' : 'w-9 justify-center'"
    @click="cycle"
  >
    <Icon :name="icons[mode]" class="size-5 shrink-0" />
    <span v-if="labelled">{{ names[mode] }}</span>
  </button>
</template>

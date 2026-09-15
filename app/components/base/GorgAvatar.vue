<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  name?: string
  size?: Size
  squared?: boolean
  ring?: boolean
  status?: 'online' | 'away' | 'busy' | 'offline'
}>(), { size: 'md', alt: '' })

const sizes: Record<Size, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
}

const dotSizes: Record<Size, string> = {
  xs: 'size-1.5', sm: 'size-2', md: 'size-2.5', lg: 'size-3', xl: 'size-3.5',
}

const statusTone = {
  online: 'bg-[var(--color-positive)]',
  away: 'bg-[var(--color-caution)]',
  busy: 'bg-[var(--color-critical)]',
  offline: 'bg-ink-400',
}

// "Ada Lovelace" -> "AL"; falls back to a single glyph for mononyms.
const shell = computed(() => [
  'inline-flex items-center justify-center overflow-hidden bg-[var(--surface-sunken)] font-medium text-[var(--text-muted)] select-none',
  props.squared ? 'rounded-field' : 'rounded-pill',
  props.ring ? 'ring-2 ring-tide-500 ring-offset-2 ring-offset-[var(--surface-page)]' : '',
])

const initials = computed(() => (props.name ?? '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(w => w[0]!.toUpperCase())
  .join(''))
</script>

<template>
  <div class="relative inline-flex shrink-0">
    <!-- Reka's AvatarRoot derives its state from AvatarImage's load lifecycle, so
         with no `src` there is no image to fail and AvatarFallback (which only
         renders on 'error') would never appear. Render initials directly in that
         case and keep Reka for the path where the lifecycle actually matters. -->
    <AvatarRoot
      v-if="src"
      :class="[shell, sizes[size]]"
    >
      <AvatarImage :src="src" :alt="alt" class="size-full object-cover" />
      <AvatarFallback :delay-ms="400" class="size-full inline-flex items-center justify-center">
        <slot>
          <span v-if="initials">{{ initials }}</span>
          <Icon v-else name="lucide:user" class="size-1/2" />
        </slot>
      </AvatarFallback>
    </AvatarRoot>

    <span
      v-else
      :class="[shell, sizes[size]]"
      role="img"
      :aria-label="alt || name || 'Avatar'"
    >
      <slot>
        <span v-if="initials">{{ initials }}</span>
        <Icon v-else name="lucide:user" class="size-1/2" />
      </slot>
    </span>

    <span
      v-if="status"
      class="absolute end-0 bottom-0 rounded-pill ring-2 ring-[var(--surface-raised)]"
      :class="[dotSizes[size], statusTone[status]]"
      :aria-label="status"
    />
  </div>
</template>

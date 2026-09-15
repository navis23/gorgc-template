<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxRoot,
  VisuallyHidden,
} from 'reka-ui'

interface CommandItem {
  id: string | number
  label: string
  icon?: string
  /** secondary line — the section, the record, whatever disambiguates */
  hint?: string
  /** rendered through GorgKbd, e.g. `['⌘', 'S']` */
  shortcut?: string[]
  /** navigated to on activation */
  to?: string
  disabled?: boolean
}

interface CommandGroup {
  label?: string
  items: CommandItem[]
}

const props = withDefaults(defineProps<{
  groups?: CommandGroup[]
  placeholder?: string
  emptyMessage?: string
  /** accessible name for the dialog itself */
  title?: string
}>(), {
  groups: () => [],
  placeholder: 'Search commands, pages and records…',
  emptyMessage: 'Nothing matches that',
  title: 'Command palette',
})

const emit = defineEmits<{ select: [item: CommandItem] }>()

const open = defineModel<boolean>('open', { default: false })

const query = ref('')

/**
 * Substring first — it is what people expect — then a subsequence pass so
 * `nsg` still finds "New settings group". Matching is done by hand rather
 * than with a locale-aware collator: ICU data differs between Node and the
 * browser and the two renders would disagree.
 */
function isSubsequence(haystack: string, needle: string): boolean {
  let cursor = 0
  for (let i = 0; i < haystack.length && cursor < needle.length; i++) {
    if (haystack[i] === needle[cursor])
      cursor++
  }
  return cursor === needle.length
}

function itemMatches(item: CommandItem, needle: string, groupLabel?: string): boolean {
  if (!needle)
    return true

  const label = item.label.toLowerCase()
  const haystack = `${label} ${(item.hint ?? '').toLowerCase()} ${(groupLabel ?? '').toLowerCase()}`

  return haystack.includes(needle) || isSubsequence(label, needle)
}

/** Groups whose every item was filtered out drop their label with them. */
const filteredGroups = computed<CommandGroup[]>(() => {
  const needle = query.value.trim().toLowerCase()

  return props.groups
    .map(group => ({ label: group.label, items: group.items.filter(item => itemMatches(item, needle, group.label)) }))
    .filter(group => group.items.length > 0)
})

const hasMatches = computed(() => filteredGroups.value.length > 0)

const listbox = useTemplateRef<{ highlightFirstItem: () => void }>('listbox')

// Reka re-highlights the first row on every keystroke; opening needs the nudge.
watch(open, async (value) => {
  if (!value)
    return
  query.value = ''
  await nextTick()
  listbox.value?.highlightFirstItem()
})

async function onSelect(item: CommandItem, event: Event) {
  if (item.disabled) {
    event.preventDefault()
    return
  }

  emit('select', item)
  open.value = false

  if (item.to)
    await navigateTo(item.to)
}

/**
 * ⌘K / Ctrl+K. Registered in `onMounted` so it never runs on the server, and
 * torn down again on unmount — a stray window listener outlives the page.
 */
function onWindowKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey)
    return
  if (event.key !== 'k' && event.key !== 'K')
    return

  event.preventDefault()
  open.value = !open.value
}

onMounted(() => window.addEventListener('keydown', onWindowKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onWindowKeydown))
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm
               data-[state=open]:fade-in data-[state=closed]:fade-out"
      />

      <!--
        Centred with `inset-x-4 mx-auto` rather than `start-1/2 -translate-x-1/2`:
        the pop-in keyframes animate `transform`, which would otherwise wipe out
        the centring translate for the length of the animation.
      -->
      <DialogContent
        class="fixed inset-x-4 top-[8vh] z-50 mx-auto flex max-h-[min(30rem,76vh)] max-w-xl
               flex-col overflow-hidden surface-card shadow-lift focus:outline-none
               data-[state=open]:pop-in data-[state=closed]:pop-out"
      >
        <VisuallyHidden>
          <DialogTitle>{{ title }}</DialogTitle>
          <DialogDescription>
            Type to filter. Arrow keys move through the results, Enter runs the highlighted one.
          </DialogDescription>
        </VisuallyHidden>

        <ListboxRoot
          ref="listbox"
          highlight-on-hover
          class="flex min-h-0 flex-1 flex-col"
        >
          <div class="flex shrink-0 items-center gap-3 border-b border-[var(--surface-border)] px-4">
            <Icon name="lucide:search" class="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />

            <ListboxFilter
              v-model="query"
              auto-focus
              :placeholder="placeholder"
              :aria-label="placeholder"
              class="h-13 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-strong)]
                     outline-none placeholder:text-[var(--text-muted)]"
            />

            <GorgKbd :keys="['Esc']" class="hidden shrink-0 sm:inline-flex" />
          </div>

          <ListboxContent class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 focus:outline-none">
            <ListboxGroup
              v-for="(group, index) in filteredGroups"
              :key="group.label ?? index"
              class="pb-1 last:pb-0"
            >
              <ListboxGroupLabel
                v-if="group.label"
                class="px-2.5 pt-2 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
              >
                {{ group.label }}
              </ListboxGroupLabel>

              <ListboxItem
                v-for="item in group.items"
                :key="item.id"
                :value="item.id"
                :disabled="item.disabled"
                class="group flex cursor-pointer select-none items-center gap-3 rounded-field px-2.5 py-2 text-sm
                       outline-none transition-colors duration-(--duration-snap)
                       data-[highlighted]:bg-tide-50 data-[highlighted]:text-tide-900
                       data-[disabled]:pointer-events-none data-[disabled]:opacity-40
                       dark:data-[highlighted]:bg-tide-900/40 dark:data-[highlighted]:text-tide-50"
                @select="onSelect(item, $event)"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)]
                         text-[var(--text-muted)] transition-colors duration-(--duration-snap)
                         group-data-[highlighted]:bg-transparent group-data-[highlighted]:text-inherit"
                >
                  <Icon :name="item.icon ?? 'lucide:chevron-right'" class="size-4" aria-hidden="true" />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium text-[var(--text-strong)] group-data-[highlighted]:text-inherit">
                    {{ item.label }}
                  </span>
                  <span
                    v-if="item.hint"
                    class="block truncate text-xs text-[var(--text-muted)] group-data-[highlighted]:text-inherit"
                  >{{ item.hint }}</span>
                </span>

                <GorgKbd v-if="item.shortcut?.length" :keys="item.shortcut" class="shrink-0" />
                <Icon
                  v-else
                  name="lucide:corner-down-left"
                  class="size-4 shrink-0 opacity-0 transition-opacity duration-(--duration-snap) group-data-[highlighted]:opacity-70"
                  aria-hidden="true"
                />
              </ListboxItem>
            </ListboxGroup>

            <GorgEmptyState
              v-if="!hasMatches"
              size="sm"
              icon="lucide:search-x"
              :title="emptyMessage"
              description="Try a shorter phrase, or check the spelling."
            />
          </ListboxContent>

          <div
            class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--surface-border)]
                   bg-[var(--surface-sunken)] px-4 py-2 text-[0.6875rem] text-[var(--text-muted)]"
          >
            <span class="inline-flex items-center gap-1.5">
              <GorgKbd :keys="['↑', '↓']" /> navigate
            </span>
            <span class="inline-flex items-center gap-1.5">
              <GorgKbd :keys="['↵']" /> run
            </span>
            <span class="ms-auto inline-flex items-center gap-1.5">
              <GorgKbd :keys="['⌘', 'K']" /> toggle
            </span>
          </div>
        </ListboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

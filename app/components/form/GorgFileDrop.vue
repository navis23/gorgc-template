<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Native accept string, e.g. `image/*,.pdf`. */
  accept?: string
  multiple?: boolean
  /** Per-file ceiling in bytes. */
  maxSize?: number
  /** Cap on how many files may be held at once. */
  maxFiles?: number
  disabled?: boolean
  title?: string
  hint?: string
  error?: boolean | string
  id?: string
}>(), {
  title: 'Drop files here',
  hint: 'or click to browse your device',
})

const emit = defineEmits<{
  change: [files: File[]]
  reject: [reason: string, file: File]
  remove: [file: File]
}>()

const files = defineModel<File[]>({ default: () => [] })

const uid = useId()
const dropId = computed(() => props.id ?? `gorg-filedrop-${uid}`)
const inputEl = ref<HTMLInputElement | null>(null)
const depth = ref(0)
const rejection = ref('')

const isDragging = computed(() => depth.value > 0)
const isInvalid = computed(() => props.error === true || typeof props.error === 'string' || rejection.value.length > 0)

const units = ['B', 'KB', 'MB', 'GB']

function formatSize(bytes: number) {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

function iconFor(file: File) {
  if (file.type.startsWith('image/'))
    return 'lucide:image'
  if (file.type.startsWith('video/'))
    return 'lucide:film'
  if (file.type.startsWith('audio/'))
    return 'lucide:music'
  if (file.type.includes('pdf'))
    return 'lucide:file-text'
  if (file.type.includes('zip') || file.type.includes('compressed'))
    return 'lucide:file-archive'
  return 'lucide:file'
}

function matchesAccept(file: File) {
  if (!props.accept)
    return true

  return props.accept.split(',').map(entry => entry.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.'))
      return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith('/*'))
      return file.type.toLowerCase().startsWith(rule.slice(0, -1))
    return file.type.toLowerCase() === rule
  })
}

function addFiles(incoming: File[]) {
  const next = props.multiple ? [...files.value] : []
  let blocked = ''

  for (const file of incoming) {
    if (!matchesAccept(file)) {
      blocked = `${file.name} is not an accepted file type`
      emit('reject', 'type', file)
      continue
    }
    if (props.maxSize !== undefined && file.size > props.maxSize) {
      blocked = `${file.name} is larger than ${formatSize(props.maxSize)}`
      emit('reject', 'size', file)
      continue
    }
    if (props.maxFiles !== undefined && next.length >= props.maxFiles) {
      blocked = `Only ${props.maxFiles} file${props.maxFiles === 1 ? '' : 's'} allowed`
      emit('reject', 'count', file)
      continue
    }
    if (next.some(existing => existing.name === file.name && existing.size === file.size))
      continue

    next.push(file)
    if (!props.multiple)
      break
  }

  rejection.value = blocked
  files.value = next
  emit('change', next)
}

function onBrowse() {
  if (props.disabled)
    return
  inputEl.value?.click()
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  addFiles(Array.from(target.files ?? []))
  target.value = ''
}

function onDrop(event: DragEvent) {
  depth.value = 0
  if (props.disabled)
    return
  addFiles(Array.from(event.dataTransfer?.files ?? []))
}

function onDragEnter() {
  if (!props.disabled)
    depth.value += 1
}

function onDragLeave() {
  depth.value = Math.max(0, depth.value - 1)
}

function remove(index: number) {
  const file = files.value[index]
  const next = files.value.filter((_, position) => position !== index)
  files.value = next
  rejection.value = ''
  if (file)
    emit('remove', file)
  emit('change', next)
}

function clear() {
  files.value = []
  rejection.value = ''
  emit('change', [])
}

defineExpose({ browse: onBrowse, clear })
</script>

<template>
  <div class="w-full">
    <input
      :id="dropId"
      ref="inputEl"
      type="file"
      class="sr-only"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @change="onPick"
    >

    <button
      type="button"
      :disabled="disabled"
      :aria-describedby="`${dropId}-hint`"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10
             text-center transition-[border-color,background-color,transform] duration-(--duration-base)
             disabled:cursor-not-allowed disabled:opacity-60"
      :class="[
        isDragging
          ? 'border-tide-500 bg-tide-50 scale-[1.01] dark:bg-tide-900/25'
          : isInvalid
            ? 'border-[var(--color-critical)] bg-[var(--surface-raised)]'
            : 'border-[var(--surface-border)] bg-[var(--surface-raised)] hover:border-tide-400 hover:bg-[var(--surface-sunken)]',
      ]"
      @click="onBrowse"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <span
        class="grid size-12 place-items-center rounded-pill transition-colors duration-(--duration-base)"
        :class="isDragging ? 'bg-tide-100 text-tide-700 dark:bg-tide-900/60 dark:text-tide-100' : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'"
      >
        <Icon :name="isDragging ? 'lucide:download' : 'lucide:cloud-upload'" class="size-6" aria-hidden="true" />
      </span>

      <span class="text-sm font-semibold text-[var(--text-strong)]">
        <slot name="title">{{ isDragging ? 'Release to upload' : title }}</slot>
      </span>

      <span :id="`${dropId}-hint`" class="text-xs text-[var(--text-muted)]">
        <slot name="hint">
          {{ hint }}<template v-if="maxSize"> · up to {{ formatSize(maxSize) }} each</template>
        </slot>
      </span>
    </button>

    <GorgFieldError :message="rejection" :show="rejection.length > 0" />

    <ul v-if="files.length" class="mt-3 flex flex-col gap-2">
      <li
        v-for="(file, index) in files"
        :key="`${file.name}-${file.size}-${index}`"
        class="flex items-center gap-3 rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)]
               px-3 py-2 shadow-raise"
      >
        <span class="grid size-9 shrink-0 place-items-center rounded-field bg-[var(--surface-sunken)] text-[var(--text-muted)]">
          <Icon :name="iconFor(file)" class="size-4" aria-hidden="true" />
        </span>

        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-[var(--text-strong)]">{{ file.name }}</span>
          <span class="block font-mono text-xs tabular-nums text-[var(--text-muted)]">{{ formatSize(file.size) }}</span>
        </span>

        <button
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-field text-[var(--text-muted)]
                 transition-colors duration-(--duration-snap)
                 hover:bg-[var(--surface-sunken)] hover:text-[var(--color-critical)]"
          :aria-label="`Remove ${file.name}`"
          @click="remove(index)"
        >
          <Icon name="lucide:trash-2" class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>

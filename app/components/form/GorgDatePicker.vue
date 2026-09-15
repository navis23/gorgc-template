<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import {
  CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody,
  CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader,
  CalendarNext, CalendarPrev, CalendarRoot,
  PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger,
} from 'reka-ui'
import { dayLabel, MONTHS_SHORT, WEEKDAYS_SHORT } from '~/utils/datetime'

const props = withDefaults(defineProps<{
  placeholder?: string
  min?: Date
  max?: Date
  disabled?: boolean
  readonly?: boolean
  error?: boolean | string
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
  id?: string
}>(), { placeholder: 'Select a date', size: 'md' })

/** Consumers work in plain `Date`; CalendarDate stays an internal detail. */
const model = defineModel<Date | null>()

const open = ref(false)
const uid = useId()
const inputId = computed(() => props.id ?? `gorg-datepicker-${uid}`)

const toCalendar = (d?: Date | null) =>
  d ? new CalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) : undefined

const fromCalendar = (v?: DateValue | null) =>
  v ? new Date(Date.UTC(v.year, v.month - 1, v.day)) : null

const calendarValue = computed({
  get: () => toCalendar(model.value),
  set: (v) => { model.value = fromCalendar(v) },
})

const minValue = computed(() => toCalendar(props.min))
const maxValue = computed(() => toCalendar(props.max))

// Reka's own heading/weekday parts format through Intl, whose data differs
// between Node and the browser. Every label here is rendered from our own
// constants instead, so SSR and client always agree.
const monthLabel = (placeholder: DateValue) =>
  `${MONTHS_SHORT[placeholder.month - 1]} ${placeholder.year}`

const label = computed(() => (model.value ? dayLabel(model.value) : ''))

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
}

const isInvalid = computed(() => props.error === true || typeof props.error === 'string')

function clear(event: Event) {
  event.stopPropagation()
  model.value = null
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      :id="inputId"
      :disabled="disabled || readonly"
      :aria-invalid="isInvalid || undefined"
      class="inline-flex w-full items-center gap-2 rounded-field border bg-[var(--surface-raised)] text-start shadow-raise
             transition-[border-color,box-shadow] duration-(--duration-snap)
             disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-60"
      :class="[
        sizes[size],
        isInvalid
          ? 'border-[var(--color-critical)]'
          : 'border-[var(--surface-border)] hover:border-ink-300 dark:hover:border-ink-700',
      ]"
    >
      <Icon name="lucide:calendar" class="size-4 shrink-0 text-[var(--text-muted)]" />
      <span class="flex-1 truncate" :class="label ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'">
        {{ label || placeholder }}
      </span>
      <span
        v-if="clearable && label && !disabled"
        role="button"
        tabindex="0"
        aria-label="Clear date"
        class="grid size-5 shrink-0 place-items-center rounded-pill text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        @click="clear"
        @keydown.enter.stop.prevent="clear($event)"
        @keydown.space.stop.prevent="clear($event)"
      >
        <Icon name="lucide:x" class="size-3.5" />
      </span>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="6"
        align="start"
        class="z-50 surface-card p-3 shadow-lift focus:outline-none
               data-[state=open]:pop-in"
      >
        <CalendarRoot
          v-slot="{ grid, weekDays }"
          v-model="calendarValue"
          :min-value="minValue"
          :max-value="maxValue"
          :week-starts-on="1"
          fixed-weeks
          initial-focus
          class="select-none"
          @update:model-value="open = false"
        >
          <CalendarHeader class="mb-2 flex items-center justify-between gap-2">
            <CalendarPrev
              aria-label="Previous month"
              class="grid size-7 place-items-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <Icon name="lucide:chevron-left" class="size-4" />
            </CalendarPrev>

            <!-- our own heading: Reka's would format through Intl -->
            <p class="text-sm font-semibold text-[var(--text-strong)]">
              {{ monthLabel(grid[0]!.value) }}
            </p>

            <CalendarNext
              aria-label="Next month"
              class="grid size-7 place-items-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <Icon name="lucide:chevron-right" class="size-4" />
            </CalendarNext>
          </CalendarHeader>

          <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse">
            <CalendarGridHead>
              <CalendarGridRow class="grid grid-cols-7">
                <CalendarHeadCell
                  v-for="(_, i) in weekDays"
                  :key="i"
                  class="py-1 text-center text-[10px] font-medium text-[var(--text-muted)]"
                >
                  {{ WEEKDAYS_SHORT[i] }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>

            <CalendarGridBody>
              <CalendarGridRow
                v-for="(week, i) in month.rows"
                :key="`w${i}`"
                class="grid grid-cols-7"
              >
                <CalendarCell v-for="day in week" :key="day.toString()" :date="day" class="p-0.5">
                  <CalendarCellTrigger
                    :day="day"
                    :month="month.value"
                    class="grid size-8 place-items-center rounded-field text-xs transition
                           data-[outside-view]:opacity-35
                           data-[disabled]:pointer-events-none data-[disabled]:opacity-30
                           data-[selected]:bg-tide-600 data-[selected]:font-semibold data-[selected]:text-white
                           data-[today]:font-semibold data-[today]:text-tide-600 dark:data-[today]:text-tide-300
                           hover:bg-[var(--surface-sunken)] data-[selected]:hover:bg-tide-700"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

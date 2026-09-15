<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import {
  PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger,
  RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid,
  RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow,
  RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarNext,
  RangeCalendarPrev, RangeCalendarRoot,
} from 'reka-ui'
import { demoDate, MONTHS_SHORT, shortDayLabel, WEEKDAYS_SHORT } from '~/utils/datetime'

export interface DateRange { start: Date | null, end: Date | null }

export interface RangePreset {
  label: string
  /** Days back from today. 6 = "last 7 days" inclusive. */
  days: number
}

const props = withDefaults(defineProps<{
  placeholder?: string
  min?: Date
  max?: Date
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Quick ranges shown beside the calendar. Pass `[]` to hide them. */
  presets?: RangePreset[]
  months?: 1 | 2
  id?: string
}>(), {
  placeholder: 'Select a range',
  size: 'md',
  months: 2,
  presets: () => ([
    { label: 'Last 7 days', days: 6 },
    { label: 'Last 30 days', days: 29 },
    { label: 'Last 90 days', days: 89 },
  ]),
})

const model = defineModel<DateRange>({ default: () => ({ start: null, end: null }) })

const open = ref(false)
const uid = useId()
const triggerId = computed(() => props.id ?? `gorg-range-${uid}`)

const toCalendar = (d?: Date | null) =>
  d ? new CalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) : undefined

const fromCalendar = (v?: DateValue | null) =>
  v ? new Date(Date.UTC(v.year, v.month - 1, v.day)) : null

const calendarValue = computed({
  get: () => ({ start: toCalendar(model.value.start), end: toCalendar(model.value.end) }),
  set: (v) => {
    model.value = { start: fromCalendar(v?.start), end: fromCalendar(v?.end) }
    // Close only once a complete range has been picked.
    if (v?.start && v?.end)
      open.value = false
  },
})

const minValue = computed(() => toCalendar(props.min))
const maxValue = computed(() => toCalendar(props.max))

// Reka's heading and weekday parts format through Intl, whose data differs
// between Node and the browser; every label here comes from our own constants.
const monthLabel = (value: DateValue) => `${MONTHS_SHORT[value.month - 1]} ${value.year}`

const label = computed(() => {
  const { start, end } = model.value
  if (!start)
    return ''
  if (!end)
    return `${shortDayLabel(start)} — …`
  return `${shortDayLabel(start)} — ${shortDayLabel(end)}`
})

function applyPreset(preset: RangePreset) {
  model.value = { start: demoDate(-preset.days), end: demoDate(0) }
  open.value = false
}

const activePreset = computed(() => {
  const { start, end } = model.value
  if (!start || !end)
    return null
  const span = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return props.presets.find(p => p.days === span)?.label ?? null
})

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      :id="triggerId"
      :disabled="disabled"
      class="inline-flex items-center gap-2 rounded-field border border-[var(--surface-border)] bg-[var(--surface-raised)] text-start shadow-raise
             transition-[border-color,box-shadow] duration-(--duration-snap)
             hover:border-ink-300 dark:hover:border-ink-700
             disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-60"
      :class="sizes[size]"
    >
      <Icon name="lucide:calendar-range" class="size-4 shrink-0 text-[var(--text-muted)]" />
      <span class="truncate" :class="label ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'">
        {{ activePreset ?? label ?? placeholder }}
      </span>
      <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-[var(--text-muted)]" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="6"
        align="end"
        class="z-50 surface-card shadow-lift focus:outline-none
               data-[state=open]:pop-in"
      >
        <div class="flex flex-col sm:flex-row">
          <div
            v-if="presets.length"
            class="flex gap-1 overflow-x-auto border-b border-[var(--surface-border)] p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-e"
          >
            <button
              v-for="p in presets"
              :key="p.label"
              type="button"
              class="whitespace-nowrap rounded-field px-3 py-1.5 text-start text-xs font-medium transition"
              :class="activePreset === p.label
                ? 'bg-tide-100 text-tide-800 dark:bg-tide-900/50 dark:text-tide-100'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'"
              :aria-pressed="activePreset === p.label"
              @click="applyPreset(p)"
            >{{ p.label }}</button>
          </div>

          <RangeCalendarRoot
            v-slot="{ grid, weekDays }"
            v-model="calendarValue"
            :min-value="minValue"
            :max-value="maxValue"
            :number-of-months="months"
            :week-starts-on="1"
            fixed-weeks
            initial-focus
            class="select-none p-3"
          >
            <RangeCalendarHeader class="mb-2 flex items-center justify-between gap-2">
              <RangeCalendarPrev
                aria-label="Previous month"
                class="grid size-7 place-items-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
              >
                <Icon name="lucide:chevron-left" class="size-4" />
              </RangeCalendarPrev>
              <p class="text-sm font-semibold text-[var(--text-strong)]">
                {{ grid.map(m => monthLabel(m.value)).join(' – ') }}
              </p>
              <RangeCalendarNext
                aria-label="Next month"
                class="grid size-7 place-items-center rounded-field text-[var(--text-muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
              >
                <Icon name="lucide:chevron-right" class="size-4" />
              </RangeCalendarNext>
            </RangeCalendarHeader>

            <div class="flex flex-col gap-4 sm:flex-row">
              <RangeCalendarGrid
                v-for="month in grid"
                :key="month.value.toString()"
                class="border-collapse"
              >
                <RangeCalendarGridHead>
                  <RangeCalendarGridRow class="grid grid-cols-7">
                    <RangeCalendarHeadCell
                      v-for="(_, i) in weekDays"
                      :key="i"
                      class="py-1 text-center text-[10px] font-medium text-[var(--text-muted)]"
                    >
                      {{ WEEKDAYS_SHORT[i] }}
                    </RangeCalendarHeadCell>
                  </RangeCalendarGridRow>
                </RangeCalendarGridHead>

                <RangeCalendarGridBody>
                  <RangeCalendarGridRow
                    v-for="(week, i) in month.rows"
                    :key="`w${i}`"
                    class="grid grid-cols-7"
                  >
                    <RangeCalendarCell
                      v-for="day in week"
                      :key="day.toString()"
                      :date="day"
                      class="p-0"
                    >
                      <RangeCalendarCellTrigger
                        :day="day"
                        :month="month.value"
                        class="grid size-8 place-items-center text-xs transition
                               data-[outside-view]:opacity-35
                               data-[disabled]:pointer-events-none data-[disabled]:opacity-30
                               data-[highlighted]:bg-tide-100 dark:data-[highlighted]:bg-tide-900/40
                               data-[selected]:bg-tide-100 dark:data-[selected]:bg-tide-900/40
                               data-[selection-start]:rounded-s-field data-[selection-start]:bg-tide-600 data-[selection-start]:font-semibold data-[selection-start]:text-white
                               data-[selection-end]:rounded-e-field data-[selection-end]:bg-tide-600 data-[selection-end]:font-semibold data-[selection-end]:text-white
                               data-[today]:font-semibold data-[today]:text-tide-600 dark:data-[today]:text-tide-300
                               hover:bg-[var(--surface-sunken)]"
                      />
                    </RangeCalendarCell>
                  </RangeCalendarGridRow>
                </RangeCalendarGridBody>
              </RangeCalendarGrid>
            </div>
          </RangeCalendarRoot>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

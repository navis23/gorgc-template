<script setup lang="ts">
import {
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui'

type StepValue = string | number
type Size = 'sm' | 'md'

interface Step {
  value: StepValue
  title: string
  description?: string
  icon?: string
}

const props = withDefaults(defineProps<{
  steps?: Step[]
  orientation?: 'horizontal' | 'vertical'
  size?: Size
  /** steps ahead of the current one are not clickable */
  linear?: boolean
  ariaLabel?: string
}>(), {
  steps: () => [],
  orientation: 'horizontal',
  size: 'md',
  linear: false,
  ariaLabel: 'Progress',
})

const emit = defineEmits<{ 'step-click': [step: Step, index: number] }>()

const model = defineModel<StepValue>({ default: '' })

const first = props.steps[0]
if ((model.value === '' || model.value === undefined) && first)
  model.value = first.value

const currentIndex = computed(() => {
  const index = props.steps.findIndex(step => step.value === model.value)
  return index === -1 ? 0 : index
})

const current = computed<Step | undefined>(() => props.steps[currentIndex.value])
const lastIndex = computed(() => props.steps.length - 1)

/** Reka addresses steps by a 1-based number; the public API is by value. */
const currentStep = computed(() => currentIndex.value + 1)

const progress = computed(() =>
  props.steps.length ? ((currentIndex.value + 1) / props.steps.length) * 100 : 0)

type State = 'complete' | 'current' | 'upcoming'

function stateAt(index: number): State {
  if (index < currentIndex.value)
    return 'complete'
  return index === currentIndex.value ? 'current' : 'upcoming'
}

/**
 * Reka only emits `update:modelValue` when a trigger is activated — pointer or
 * keyboard — so this doubles as the click hook.
 */
function onStepChange(step: number | undefined) {
  if (step === undefined)
    return

  const next = props.steps[step - 1]
  if (!next)
    return

  model.value = next.value
  emit('step-click', next, step - 1)
}

const nodes: Record<State, string> = {
  complete: 'border-tide-600 bg-tide-600 text-white',
  current: 'border-tide-600 bg-[var(--surface-raised)] text-tide-700 dark:text-tide-200',
  upcoming: 'border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--text-muted)]',
}

const titles: Record<State, string> = {
  complete: 'text-[var(--text-strong)]',
  current: 'text-[var(--text-strong)]',
  upcoming: 'text-[var(--text-muted)]',
}

const sizes: Record<Size, {
  node: string
  icon: string
  title: string
  description: string
  /** vertical centre of the node, for the absolutely placed rail */
  railTop: string
  railStart: string
  railGap: string
}> = {
  sm: {
    node: 'size-8 border-2',
    icon: 'size-4',
    title: 'text-xs',
    description: 'text-[0.6875rem]',
    railTop: 'top-4',
    railStart: 'start-4',
    railGap: 'top-9',
  },
  md: {
    node: 'size-10 border-2',
    icon: 'size-5',
    title: 'text-sm',
    description: 'text-xs',
    railTop: 'top-5',
    railStart: 'start-5',
    railGap: 'top-11',
  },
}

const railFill: Record<State, string> = {
  complete: 'bg-tide-500',
  current: 'bg-[var(--surface-border)]',
  upcoming: 'bg-[var(--surface-border)]',
}
</script>

<template>
  <div v-if="steps.length" class="w-full">
    <!-- vertical: works at every width, so it is the only rendering -->
    <StepperRoot
      v-if="orientation === 'vertical'"
      :model-value="currentStep"
      :linear="linear"
      orientation="vertical"
      :aria-label="ariaLabel"
      class="flex w-full flex-col"
      @update:model-value="onStepChange"
    >
      <StepperItem
        v-for="(step, index) in steps"
        :key="step.value"
        :step="index + 1"
        :completed="index < currentIndex"
        :disabled="linear && index > currentIndex"
        :aria-current="index === currentIndex ? 'step' : undefined"
        class="relative flex w-full"
        :class="index < lastIndex && (size === 'sm' ? 'pb-5' : 'pb-6')"
      >
        <StepperSeparator
          v-if="index < lastIndex"
          as="span"
          class="absolute bottom-1 w-0.5 -translate-x-1/2 rounded-pill transition-colors duration-(--duration-slow) rtl:translate-x-1/2"
          :class="[sizes[size].railStart, sizes[size].railGap, railFill[stateAt(index)]]"
        />

        <StepperTrigger
          class="relative z-10 flex w-full items-start gap-3 rounded-field text-start outline-offset-2
                 transition-opacity duration-(--duration-snap)
                 data-[disabled]:pointer-events-none data-[disabled]:opacity-60"
        >
          <StepperIndicator
            class="grid shrink-0 place-items-center rounded-pill
                   transition-[background-color,border-color,color] duration-(--duration-base)"
            :class="[sizes[size].node, nodes[stateAt(index)]]"
          >
            <Icon
              :name="stateAt(index) === 'complete' ? 'lucide:check' : (step.icon ?? 'lucide:circle')"
              :class="sizes[size].icon"
              aria-hidden="true"
            />
          </StepperIndicator>

          <span class="min-w-0 flex-1 pt-1">
            <StepperTitle
              as="span"
              class="block font-semibold"
              :class="[sizes[size].title, titles[stateAt(index)]]"
            >
              <span class="sr-only">Step {{ index + 1 }} of {{ steps.length }}: </span>{{ step.title }}
            </StepperTitle>
            <StepperDescription
              v-if="step.description"
              as="span"
              class="mt-0.5 block leading-relaxed text-[var(--text-muted)]"
              :class="sizes[size].description"
            >
              {{ step.description }}
            </StepperDescription>
          </span>
        </StepperTrigger>
      </StepperItem>
    </StepperRoot>

    <template v-else>
      <!-- horizontal rail — folds away rather than squashing -->
      <StepperRoot
        :model-value="currentStep"
        :linear="linear"
        orientation="horizontal"
        :aria-label="ariaLabel"
        class="hidden w-full items-start sm:flex"
        @update:model-value="onStepChange"
      >
        <StepperItem
          v-for="(step, index) in steps"
          :key="step.value"
          :step="index + 1"
          :completed="index < currentIndex"
          :disabled="linear && index > currentIndex"
          :aria-current="index === currentIndex ? 'step' : undefined"
          class="relative flex min-w-0 flex-1 flex-col items-center"
        >
          <StepperSeparator
            v-if="index < lastIndex"
            as="span"
            class="absolute start-1/2 h-0.5 w-full -translate-y-1/2 rounded-pill transition-colors duration-(--duration-slow)"
            :class="[sizes[size].railTop, railFill[stateAt(index)]]"
          />

          <StepperTrigger
            class="relative z-10 flex w-full flex-col items-center gap-2 rounded-field px-1 py-1 text-center
                   outline-offset-2 transition-opacity duration-(--duration-snap)
                   data-[disabled]:pointer-events-none data-[disabled]:opacity-60"
          >
            <StepperIndicator
              class="grid shrink-0 place-items-center rounded-pill
                     transition-[background-color,border-color,color] duration-(--duration-base)"
              :class="[sizes[size].node, nodes[stateAt(index)]]"
            >
              <Icon
                :name="stateAt(index) === 'complete' ? 'lucide:check' : (step.icon ?? 'lucide:circle')"
                :class="sizes[size].icon"
                aria-hidden="true"
              />
            </StepperIndicator>

            <span class="min-w-0 max-w-full">
              <StepperTitle
                as="span"
                class="block truncate font-semibold"
                :class="[sizes[size].title, titles[stateAt(index)]]"
              >
                <span class="sr-only">Step {{ index + 1 }} of {{ steps.length }}: </span>{{ step.title }}
              </StepperTitle>
              <StepperDescription
                v-if="step.description"
                as="span"
                class="mt-0.5 block truncate text-[var(--text-muted)]"
                :class="sizes[size].description"
              >
                {{ step.description }}
              </StepperDescription>
            </span>
          </StepperTrigger>
        </StepperItem>
      </StepperRoot>

      <!-- the same progress, compact, on phones -->
      <div class="space-y-2 sm:hidden" role="group" :aria-label="ariaLabel">
        <div class="flex items-baseline justify-between gap-3">
          <p class="min-w-0 truncate font-semibold text-[var(--text-strong)]" :class="sizes[size].title">
            {{ current?.title }}
          </p>
          <p class="shrink-0 tabular-nums text-[var(--text-muted)]" :class="sizes[size].description">
            Step {{ currentIndex + 1 }} of {{ steps.length }}
          </p>
        </div>

        <GorgProgress :value="progress" size="xs" />

        <p
          v-if="current?.description"
          class="leading-relaxed text-[var(--text-muted)]"
          :class="sizes[size].description"
        >
          {{ current.description }}
        </p>
      </div>
    </template>
  </div>
</template>

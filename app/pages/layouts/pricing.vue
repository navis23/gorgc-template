<script setup lang="ts">
import type { FeatureRow, Plan } from '~/utils/mock-records'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import { featureMatrix, plans, pricingFaqs } from '~/utils/mock-records'

useHead({ title: 'Pricing' })

const toast = useToast()

/* ---- billing period ----------------------------------------------------- */

const annual = ref(false)

/**
 * Cents → `$19` when it lands on a round dollar, `$19.50` when it does not.
 * Grouped by hand rather than through `toLocaleString`, whose output depends on
 * the runtime's ICU data — a reliable way to desync SSR from hydration.
 */
function price(cents: number) {
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const rest = cents % 100
  return rest === 0 ? `$${whole}` : `$${whole}.${String(rest).padStart(2, '0')}`
}

function perMonth(plan: Plan) {
  return annual.value ? plan.annualMonthly : plan.monthly
}

function billedLine(plan: Plan) {
  return annual.value
    ? `${price(plan.annualMonthly * 12)} per seat, billed yearly`
    : `${price(plan.monthly)} per seat, billed monthly`
}

function saving(plan: Plan) {
  return (plan.monthly - plan.annualMonthly) * 12
}

/** Every tier happens to save the same share; read it off the first plan. */
const savingPercent = computed(() => {
  const reference = plans[0]
  if (!reference)
    return 0
  return Math.round((1 - reference.annualMonthly / reference.monthly) * 100)
})

function choose(plan: Plan) {
  toast.success(
    `${plan.name} selected · ${price(perMonth(plan))} per seat / month, ${annual.value ? 'billed yearly' : 'billed monthly'}`,
    { title: plan.cta },
  )
}

/* ---- comparison grid ---------------------------------------------------- */

const groups = computed(() => {
  const order: string[] = []
  const buckets = new Map<string, FeatureRow[]>()

  for (const row of featureMatrix) {
    if (!buckets.has(row.group)) {
      buckets.set(row.group, [])
      order.push(row.group)
    }
    buckets.get(row.group)!.push(row)
  }

  return order.map(name => ({ name, rows: buckets.get(name) ?? [] }))
})

const planIds = plans.map(plan => plan.id)

const plansEl = useTemplateRef<HTMLElement>('plansEl')
const faqEl = useTemplateRef<HTMLElement>('faqEl')

useStagger(plansEl, { each: 0.08, y: 18 })
useStagger(faqEl, { selector: ':scope > * > *', each: 0.05, y: 10 })
</script>

<template>
  <div class="space-y-10">
    <!-- Header + billing toggle -->
    <header class="mx-auto max-w-2xl text-center">
      <h1 class="text-2xl font-semibold text-balance text-[var(--text-strong)] sm:text-3xl">
        Pay for the seats you use, not the features you might
      </h1>
      <p class="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-balance text-[var(--text-muted)]">
        Every plan ships the whole component library. What changes higher up is the automation
        around it — syncing, gating and proving that what you shipped is accessible.
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span
          class="text-sm transition-colors duration-(--duration-snap)"
          :class="annual ? 'text-[var(--text-muted)]' : 'font-semibold text-[var(--text-strong)]'"
          aria-hidden="true"
        >Monthly</span>

        <GorgSwitch v-model="annual" align="start" size="md">
          <span class="sr-only">Bill annually instead of monthly</span>
        </GorgSwitch>

        <span
          class="text-sm transition-colors duration-(--duration-snap)"
          :class="annual ? 'font-semibold text-[var(--text-strong)]' : 'text-[var(--text-muted)]'"
          aria-hidden="true"
        >Annual</span>

        <GorgBadge :tone="annual ? 'positive' : 'neutral'" size="xs">
          <Icon name="lucide:piggy-bank" class="size-3" aria-hidden="true" />
          Save {{ savingPercent }}%
        </GorgBadge>
      </div>

      <p class="mt-2 text-xs text-[var(--text-muted)]" role="status">
        Showing {{ annual ? 'annual' : 'monthly' }} prices, per seat.
      </p>
    </header>

    <!-- Plan tiers -->
    <ul ref="plansEl" class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <li v-for="plan in plans" :key="plan.id" class="min-w-0">
        <GorgCard
          class="h-full"
          :elevation="plan.popular ? 'lift' : 'raise'"
          :class="plan.popular
            ? 'border-tide-500 ring-1 ring-tide-500 lg:-mt-2'
            : ''"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-[var(--text-strong)]">{{ plan.name }}</h2>
            <GorgBadge v-if="plan.popular" tone="brand" size="xs" variant="solid">
              <Icon name="lucide:star" class="size-3" aria-hidden="true" />
              Most popular
            </GorgBadge>
          </div>

          <p class="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{{ plan.tagline }}</p>

          <p class="mt-5 flex flex-wrap items-baseline gap-x-1.5">
            <span class="text-3xl font-semibold tabular-nums text-[var(--text-strong)]">
              {{ price(perMonth(plan)) }}
            </span>
            <span class="text-sm text-[var(--text-muted)]">per seat / month</span>
          </p>

          <p class="mt-1 text-xs text-[var(--text-muted)]">{{ billedLine(plan) }}</p>

          <p
            v-if="annual"
            class="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-positive)]"
          >
            <Icon name="lucide:trending-down" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ price(saving(plan)) }} less per seat each year
          </p>

          <GorgButton
            class="mt-5"
            block
            :variant="plan.popular ? 'solid' : 'outline'"
            @click="choose(plan)"
          >
            {{ plan.cta }}
          </GorgButton>

          <p class="mt-2 text-center text-xs text-[var(--text-muted)]">{{ plan.seats }}</p>

          <template #footer>
            <ul class="space-y-2">
              <li
                v-for="highlight in plan.highlights"
                :key="highlight"
                class="flex items-start gap-2 text-sm text-[var(--text-strong)]"
              >
                <Icon
                  name="lucide:check"
                  class="mt-0.5 size-4 shrink-0 text-[var(--color-positive)]"
                  aria-hidden="true"
                />
                <span class="min-w-0">{{ highlight }}</span>
              </li>
            </ul>
          </template>
        </GorgCard>
      </li>
    </ul>

    <!-- Feature comparison -->
    <section aria-labelledby="compare-heading" class="space-y-3">
      <div>
        <h2 id="compare-heading" class="text-lg font-semibold text-[var(--text-strong)]">
          Compare every feature
        </h2>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          A tick means included at no extra cost. A dash means the feature is not part of that plan.
        </p>
      </div>

      <div class="w-full overflow-x-auto rounded-card border border-[var(--surface-border)] bg-[var(--surface-raised)] shadow-raise">
        <table class="w-full min-w-[38rem] border-collapse text-start">
          <caption class="sr-only">
            Feature availability across the Solo, Team and Scale plans
          </caption>

          <thead>
            <tr>
              <GorgTableHeading width="40%">Feature</GorgTableHeading>
              <GorgTableHeading
                v-for="plan in plans"
                :key="plan.id"
                align="center"
              >
                {{ plan.name }}
                <span v-if="plan.popular" class="sr-only"> (most popular)</span>
              </GorgTableHeading>
            </tr>
          </thead>

          <tbody v-for="group in groups" :key="group.name">
            <tr>
              <th
                scope="colgroup"
                :colspan="planIds.length + 1"
                class="border-b border-[var(--surface-border)] bg-[var(--surface-sunken)] px-4 py-2 text-start
                       text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
              >
                {{ group.name }}
              </th>
            </tr>

            <GorgTableRow v-for="row in group.rows" :key="row.label" :hoverable="true">
              <GorgTableCell header>
                <span class="block text-sm font-medium text-[var(--text-strong)]">{{ row.label }}</span>
                <span v-if="row.detail" class="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">
                  {{ row.detail }}
                </span>
              </GorgTableCell>

              <GorgTableCell v-for="id in planIds" :key="id" align="center">
                <template v-if="typeof row.values[id] === 'boolean'">
                  <Icon
                    :name="row.values[id] ? 'lucide:circle-check' : 'lucide:minus'"
                    class="inline-block size-4.5"
                    :class="row.values[id] ? 'text-[var(--color-positive)]' : 'text-[var(--text-muted)]'"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ row.values[id] ? 'Included' : 'Not included' }}</span>
                </template>
                <span v-else class="text-sm text-[var(--text-strong)]">{{ row.values[id] }}</span>
              </GorgTableCell>
            </GorgTableRow>
          </tbody>
        </table>
      </div>
    </section>

    <!-- FAQ -->
    <section aria-labelledby="faq-heading" class="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
      <div>
        <h2 id="faq-heading" class="text-lg font-semibold text-[var(--text-strong)]">
          Questions people actually ask
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
          If yours is not here, mail
          <a href="#" class="rounded-field font-medium text-tide-700 underline underline-offset-2 dark:text-tide-300">
            sales@gorgsystems.example
          </a>
          and a person will answer.
        </p>
      </div>

      <GorgCard :padded="false" class="min-w-0 overflow-hidden">
        <div ref="faqEl">
        <AccordionRoot
          type="single"
          collapsible
          :default-value="pricingFaqs[0]?.id"
          class="divide-y divide-[var(--surface-border)]"
        >
          <AccordionItem v-for="faq in pricingFaqs" :key="faq.id" :value="faq.id">
            <AccordionHeader as="h3" class="m-0">
              <AccordionTrigger
                class="group flex w-full items-center justify-between gap-4 px-5 py-4 text-start
                       transition-colors duration-(--duration-snap) hover:bg-[var(--surface-sunken)]"
              >
                <span class="min-w-0 text-sm font-medium text-[var(--text-strong)]">{{ faq.question }}</span>
                <Icon
                  name="lucide:chevron-down"
                  class="size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-(--duration-base)
                         ease-(--ease-entrance) group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </AccordionTrigger>
            </AccordionHeader>

            <AccordionContent class="px-5 pb-4">
              <p class="max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">{{ faq.answer }}</p>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>
        </div>
      </GorgCard>
    </section>

    <!-- Closing CTA -->
    <GorgCard class="text-center">
      <h2 class="text-base font-semibold text-[var(--text-strong)]">Still weighing it up?</h2>
      <p class="mx-auto mt-1 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
        Run the full Team plan for fourteen days. No card, no sales call, and nothing switches off
        quietly at the end — we email you and let you decide.
      </p>
      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <GorgButton size="sm" @click="toast.success('Trial started — check your inbox')">
          Start the trial
        </GorgButton>
        <GorgButton variant="ghost" size="sm" @click="toast.info('Booking link sent')">
          Book a walkthrough
        </GorgButton>
      </div>
    </GorgCard>
  </div>
</template>

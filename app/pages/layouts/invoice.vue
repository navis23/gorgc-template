<script setup lang="ts">
import type { InvoiceEvent } from '~/utils/mock-records'
import { demoDate } from '~/utils/datetime'
import { formatCents, invoice, invoiceEvents, lineItems } from '~/utils/mock-records'

useHead({ title: `${invoice.number} · Invoice` })

const toast = useToast()

/* ---- money: integer cents in, formatted strings out --------------------- */

const rows = lineItems.map(item => ({ ...item, amount: item.quantity * item.unitPrice }))

const subtotal = rows.reduce((sum, row) => sum + row.amount, 0)
const discount = 60_000
const tax = Math.round((subtotal - discount) * invoice.taxRate)
const total = subtotal - discount + tax

/* ---- payment state ------------------------------------------------------ */

const paid = ref(false)
const sending = ref(false)

const status = computed(() => paid.value
  ? { label: 'Paid', tone: 'positive' as const, icon: 'lucide:circle-check' }
  : { label: 'Awaiting payment', tone: 'caution' as const, icon: 'lucide:clock' })

const events = ref<InvoiceEvent[]>(invoiceEvents.map(event => ({ ...event })))

function markPaid() {
  if (paid.value) {
    toast.info('This invoice is already settled.')
    return
  }

  paid.value = true
  events.value.push({
    id: 'e-paid',
    label: 'Paid in full',
    detail: `Bank transfer received · ${formatCents(total, invoice.currency)}`,
    at: demoDate(0, 11, 30),
    icon: 'lucide:banknote',
    tone: 'positive',
  })
  toast.success(`${invoice.number} marked as paid`, { title: 'Payment recorded' })
}

async function send() {
  sending.value = true
  await new Promise(resolve => setTimeout(resolve, 700))
  sending.value = false
  toast.success(`Sent to ${invoice.recipient.meta[1]?.value ?? 'the recipient'}`, { title: 'Invoice sent' })
}

const eventTone: Record<InvoiceEvent['tone'], string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]',
  info: 'bg-[color-mix(in_oklch,var(--color-info)_16%,transparent)] text-[var(--color-info)]',
  brand: 'bg-tide-100 text-tide-700 dark:bg-tide-900/50 dark:text-tide-200',
  positive: 'bg-[color-mix(in_oklch,var(--color-positive)_18%,transparent)] text-[var(--color-positive)]',
  caution: 'bg-[color-mix(in_oklch,var(--color-caution)_22%,transparent)] text-[var(--color-caution)]',
}

const rowsEl = useTemplateRef<HTMLElement>('rowsEl')
const eventsEl = useTemplateRef<HTMLElement>('eventsEl')

/** GorgTimeline speaks title/description; the invoice fixtures speak label/detail. */
const timelineItems = computed(() => events.value.map(event => ({
  id: event.id,
  title: event.label,
  description: event.detail,
  icon: event.icon,
  tone: event.tone,
  at: event.at,
})))

useStagger(rowsEl, { selector: ':scope > tr', each: 0.05, y: 10 })
useStagger(eventsEl, { selector: 'li', each: 0.06, y: 12 })
</script>

<template>
  <div class="space-y-6">
    <!-- Toolbar — hidden when the page is actually printed -->
    <header class="flex flex-wrap items-start justify-between gap-4 print:hidden">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl font-semibold text-[var(--text-strong)]">Invoice {{ invoice.number }}</h1>
          <GorgBadge :tone="status.tone" size="sm">
            <Icon :name="status.icon" class="size-3.5" aria-hidden="true" />
            {{ status.label }}
          </GorgBadge>
        </div>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ invoice.recipient.name }} · issued {{ invoice.issued }} · due {{ invoice.due }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <GorgButton variant="outline" size="sm" @click="toast.info(`${invoice.number}.pdf is downloading`)">
          <template #lead>
            <Icon name="lucide:download" class="size-4" />
          </template>
          Download
        </GorgButton>

        <GorgButton variant="outline" size="sm" :loading="sending" @click="send">
          <template #lead>
            <Icon name="lucide:send" class="size-4" />
          </template>
          Send
        </GorgButton>

        <GorgButton
          :variant="paid ? 'soft' : 'solid'"
          size="sm"
          :disabled="paid"
          @click="markPaid"
        >
          <template #lead>
            <Icon :name="paid ? 'lucide:check' : 'lucide:banknote'" class="size-4" />
          </template>
          {{ paid ? 'Paid' : 'Mark paid' }}
        </GorgButton>
      </div>
    </header>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
      <!-- The printable document -->
      <GorgCard :padded="false" class="min-w-0 overflow-hidden print:shadow-none">
        <!-- Issuer / recipient -->
        <div class="grid gap-6 border-b border-[var(--surface-border)] p-5 sm:grid-cols-2 sm:p-6">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <span class="grid size-9 shrink-0 place-items-center rounded-field bg-tide-600 text-white shadow-raise">
                <Icon name="lucide:hexagon" class="size-5" aria-hidden="true" />
              </span>
              <p class="min-w-0 text-base font-semibold text-balance text-[var(--text-strong)]">
                {{ invoice.issuer.name }}
              </p>
            </div>

            <address class="mt-3 not-italic text-sm leading-relaxed text-[var(--text-muted)]">
              <span v-for="line in invoice.issuer.lines" :key="line" class="block">{{ line }}</span>
            </address>

            <dl class="mt-3 space-y-1 text-xs">
              <div v-for="meta in invoice.issuer.meta" :key="meta.label" class="flex gap-2">
                <dt class="w-14 shrink-0 text-[var(--text-muted)]">{{ meta.label }}</dt>
                <dd class="min-w-0 break-words text-[var(--text-strong)]">{{ meta.value }}</dd>
              </div>
            </dl>
          </div>

          <div class="min-w-0 sm:text-end">
            <p class="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Billed to</p>
            <p class="mt-1.5 text-base font-semibold text-[var(--text-strong)]">
              {{ invoice.recipient.name }}
            </p>

            <address class="mt-2 not-italic text-sm leading-relaxed text-[var(--text-muted)]">
              <span v-for="line in invoice.recipient.lines" :key="line" class="block">{{ line }}</span>
            </address>

            <dl class="mt-3 space-y-1 text-xs">
              <div
                v-for="meta in invoice.recipient.meta"
                :key="meta.label"
                class="flex gap-2 sm:justify-end"
              >
                <dt class="shrink-0 text-[var(--text-muted)]">{{ meta.label }}</dt>
                <dd class="min-w-0 break-words text-[var(--text-strong)]">{{ meta.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Invoice meta strip -->
        <dl class="grid grid-cols-2 gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-sunken)] p-5 sm:grid-cols-4 sm:p-6">
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Invoice no.</dt>
            <dd class="mt-0.5 font-mono text-sm font-semibold break-words text-[var(--text-strong)]">{{ invoice.number }}</dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Reference</dt>
            <dd class="mt-0.5 font-mono text-sm break-words text-[var(--text-strong)]">{{ invoice.reference }}</dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Issued</dt>
            <dd class="mt-0.5 text-sm text-[var(--text-strong)]">{{ invoice.issued }}</dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-[var(--text-muted)]">Due · {{ invoice.terms }}</dt>
            <dd class="mt-0.5 text-sm text-[var(--text-strong)]">{{ invoice.due }}</dd>
          </div>
        </dl>

        <!-- Line items -->
        <div class="w-full overflow-x-auto">
          <table class="w-full min-w-[32rem] border-collapse text-start">
            <caption class="px-5 pt-5 text-start text-sm font-semibold text-[var(--text-strong)] sm:px-6">
              Line items
              <span class="ms-1 font-normal text-[var(--text-muted)]">· {{ rows.length }} entries, amounts in USD</span>
            </caption>

            <thead>
              <tr>
                <GorgTableHeading width="40%">Description</GorgTableHeading>
                <GorgTableHeading align="end" width="9%">Qty</GorgTableHeading>
                <GorgTableHeading width="13%">Unit</GorgTableHeading>
                <GorgTableHeading align="end" width="19%">Unit price</GorgTableHeading>
                <GorgTableHeading align="end" width="19%">Amount</GorgTableHeading>
              </tr>
            </thead>

            <tbody ref="rowsEl">
              <GorgTableRow v-for="row in rows" :key="row.id" :hoverable="false">
                <GorgTableCell header>
                  <span class="block font-semibold text-[var(--text-strong)]">{{ row.description }}</span>
                  <span class="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">{{ row.detail }}</span>
                </GorgTableCell>
                <GorgTableCell align="end" nowrap>
                  <span class="tabular-nums">{{ row.quantity }}</span>
                </GorgTableCell>
                <GorgTableCell nowrap>
                  <span class="text-[var(--text-muted)]">{{ row.unit }}{{ row.quantity === 1 ? '' : 's' }}</span>
                </GorgTableCell>
                <GorgTableCell align="end" nowrap>
                  <span class="tabular-nums text-[var(--text-muted)]">{{ formatCents(row.unitPrice, invoice.currency) }}</span>
                </GorgTableCell>
                <GorgTableCell align="end" nowrap>
                  <span class="font-medium tabular-nums">{{ formatCents(row.amount, invoice.currency) }}</span>
                </GorgTableCell>
              </GorgTableRow>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="flex justify-end border-t border-[var(--surface-border)] p-5 sm:p-6">
          <dl class="w-full max-w-xs space-y-2 text-sm">
            <div class="flex items-baseline justify-between gap-4">
              <dt class="text-[var(--text-muted)]">Subtotal</dt>
              <dd class="tabular-nums text-[var(--text-strong)]">{{ formatCents(subtotal, invoice.currency) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4">
              <dt class="text-[var(--text-muted)]">Returning-client discount</dt>
              <dd class="tabular-nums text-[var(--color-positive)]">−{{ formatCents(discount, invoice.currency) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4">
              <dt class="text-[var(--text-muted)]">{{ invoice.taxLabel }}</dt>
              <dd class="tabular-nums text-[var(--text-strong)]">{{ formatCents(tax, invoice.currency) }}</dd>
            </div>

            <div class="flex items-baseline justify-between gap-4 border-t border-[var(--surface-border)] pt-3">
              <dt class="text-base font-semibold text-[var(--text-strong)]">Total</dt>
              <dd class="text-base font-semibold tabular-nums text-[var(--text-strong)]">
                {{ formatCents(total, invoice.currency) }}
              </dd>
            </div>

            <div class="flex items-baseline justify-between gap-4">
              <dt class="text-xs text-[var(--text-muted)]">{{ paid ? 'Settled' : 'Amount due' }}</dt>
              <dd
                class="text-xs font-semibold tabular-nums"
                :class="paid ? 'text-[var(--color-positive)]' : 'text-[var(--text-strong)]'"
              >
                {{ paid ? formatCents(0, invoice.currency) : formatCents(total, invoice.currency) }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="border-t border-[var(--surface-border)] bg-[var(--surface-sunken)] p-5 sm:p-6">
          <p class="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Notes</p>
          <p class="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">{{ invoice.notes }}</p>
        </div>
      </GorgCard>

      <!-- Side rail: status + history -->
      <aside class="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1 print:hidden" aria-label="Invoice status and history">
        <GorgCard>
          <template #title>Payment</template>

          <div class="space-y-3">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-xs text-[var(--text-muted)]">{{ paid ? 'Paid in full' : 'Amount due' }}</span>
              <span class="text-lg font-semibold tabular-nums text-[var(--text-strong)]">
                {{ formatCents(total, invoice.currency) }}
              </span>
            </div>

            <GorgAlert v-if="paid" tone="positive" title="Settled">
              Received by bank transfer. Nothing further is owed on {{ invoice.number }}.
            </GorgAlert>
            <GorgAlert v-else tone="caution" :title="`Due ${invoice.due}`">
              Payment terms are {{ invoice.terms }}. A reminder goes out automatically three days before.
            </GorgAlert>
          </div>

          <template #footer>
            <GorgButton
              size="sm"
              block
              :variant="paid ? 'outline' : 'solid'"
              :disabled="paid"
              @click="markPaid"
            >
              <template #lead>
                <Icon :name="paid ? 'lucide:check' : 'lucide:banknote'" class="size-4" />
              </template>
              {{ paid ? 'Already paid' : 'Mark as paid' }}
            </GorgButton>
          </template>
        </GorgCard>

        <GorgCard>
          <template #title>History</template>

          <div ref="eventsEl">
            <GorgTimeline :items="timelineItems" size="sm" />
          </div>
        </GorgCard>
      </aside>
    </div>
  </div>
</template>

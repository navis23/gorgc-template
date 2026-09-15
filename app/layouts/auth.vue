<script setup lang="ts">
/**
 * Split shell for everything a signed-out visitor sees.
 *
 * The form column owns the whole screen on phones and tablets; the decorative
 * panel only joins from `lg` up, where there is room for it to mean something.
 * No app shell here — a signed-out visitor has nothing to navigate to.
 */
const highlights = [
  {
    icon: 'lucide:shield-check',
    title: 'SSO on every plan',
    copy: 'SAML, OIDC and SCIM provisioning without an enterprise upsell.',
  },
  {
    icon: 'lucide:scroll-text',
    title: 'Audited by default',
    copy: 'Every mutation lands in an append-only log you can export.',
  },
  {
    icon: 'lucide:gauge',
    title: 'Fast where it counts',
    copy: 'Median dashboard paint under 400ms against a cold cache.',
  },
]

const year = 2026
</script>

<template>
  <div class="min-h-dvh bg-[var(--surface-page)] lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <!-- form column -->
    <div class="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <header class="flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2.5 rounded-field text-[var(--text-strong)]"
        >
          <span class="grid size-9 place-items-center rounded-field bg-tide-600 text-base font-bold text-white shadow-raise">
            g
          </span>
          <span class="text-sm font-semibold tracking-tight">gorg</span>
        </NuxtLink>

        <GorgThemeToggle />
      </header>

      <main class="flex flex-1 items-center justify-center py-12">
        <div class="w-full max-w-sm">
          <slot />
        </div>
      </main>

      <footer class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
        <p>&copy; {{ year }} gorg</p>
        <nav aria-label="Legal" class="flex items-center gap-5">
          <a href="#" class="rounded-field transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]">Privacy</a>
          <a href="#" class="rounded-field transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]">Terms</a>
          <a href="#" class="rounded-field transition-colors duration-(--duration-snap) hover:text-[var(--text-strong)]">Status</a>
        </nav>
      </footer>
    </div>

    <!-- decorative column — desktop only -->
    <aside
      class="relative hidden overflow-hidden bg-gradient-to-br from-tide-700 via-tide-900 to-ember-950 lg:block"
    >
      <!-- soft light sources -->
      <span
        class="pointer-events-none absolute -top-32 -right-20 size-[28rem] rounded-pill bg-tide-400/25 blur-3xl"
        aria-hidden="true"
      />
      <span
        class="pointer-events-none absolute -bottom-40 -left-24 size-[32rem] rounded-pill bg-ember-600/25 blur-3xl"
        aria-hidden="true"
      />
      <!-- fine dot grid -->
      <span
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-tide-100)_1px,transparent_0)] bg-[size:24px_24px] opacity-[0.06]"
        aria-hidden="true"
      />

      <div class="relative flex h-full flex-col justify-between gap-12 p-12 xl:p-16">
        <p class="inline-flex w-fit items-center gap-2 rounded-pill border border-tide-100/20 bg-tide-50/10 px-3 py-1 text-xs font-medium text-tide-50 backdrop-blur">
          <span class="size-1.5 rounded-pill bg-ember-400" aria-hidden="true" />
          Operations, minus the ceremony
        </p>

        <div class="space-y-10">
          <h2 class="max-w-md text-4xl leading-tight font-semibold tracking-tight text-balance text-white xl:text-[2.75rem]">
            The console your on-call engineer actually keeps open.
          </h2>

          <ul class="max-w-md space-y-5">
            <li v-for="item in highlights" :key="item.title" class="flex gap-4">
              <span class="grid size-10 shrink-0 place-items-center rounded-field border border-tide-100/15 bg-tide-50/10 text-tide-50 backdrop-blur">
                <Icon :name="item.icon" class="size-5" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-white">{{ item.title }}</span>
                <span class="mt-1 block text-sm leading-relaxed text-tide-100/75">{{ item.copy }}</span>
              </span>
            </li>
          </ul>
        </div>

        <figure class="max-w-md rounded-card border border-tide-100/15 bg-tide-50/10 p-6 backdrop-blur">
          <blockquote class="text-sm leading-relaxed text-tide-50">
            &ldquo;We replaced three internal tools with gorg in a fortnight. The
            part that surprised me was how little training anyone needed.&rdquo;
          </blockquote>
          <figcaption class="mt-5 flex items-center gap-3">
            <GorgAvatar name="Priya Raghunathan" size="sm" />
            <span class="min-w-0 text-xs">
              <span class="block font-semibold text-white">Priya Raghunathan</span>
              <span class="block text-tide-100/70">VP Infrastructure, Meridian Freight</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </aside>

    <GorgToaster position="top-center" />
  </div>
</template>

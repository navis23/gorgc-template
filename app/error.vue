<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const panel = useTemplateRef<HTMLElement>('panel')
useReveal(panel, { y: 20 })

const known: Record<number, { title: string, hint: string }> = {
  404: { title: 'Page not found', hint: 'The link may be out of date, or the page was moved.' },
  403: { title: 'Not authorised', hint: 'Your account does not have access to this area.' },
  500: { title: 'Something broke', hint: 'An unexpected error occurred on our side.' },
}

// NuxtError.statusCode is optional, so narrow before indexing.
const status = computed(() => props.error?.statusCode ?? 500)

const detail = computed(() => known[status.value] ?? {
  title: 'Unexpected error',
  hint: props.error?.message || 'Try again in a moment.',
})
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-[var(--surface-page)] p-6">
    <div ref="panel" class="js-reveal w-full max-w-md text-center">
      <p class="font-mono text-6xl font-semibold text-tide-500">
        {{ status }}
      </p>
      <h1 class="mt-4 text-xl font-semibold text-[var(--text-strong)]">
        {{ detail.title }}
      </h1>
      <p class="mt-2 text-sm text-[var(--text-muted)]">
        {{ detail.hint }}
      </p>

      <div class="mt-6 flex justify-center gap-2">
        <GorgButton variant="outline" @click="$router.back()">
          <template #lead>
            <Icon name="lucide:arrow-left" class="size-4" />
          </template>
          Go back
        </GorgButton>
        <GorgButton @click="clearError({ redirect: '/' })">
          Back to overview
        </GorgButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Person { name: string, role: string, src?: string, status?: 'online' | 'away' | 'busy' | 'offline' }

defineProps<{ title?: string, people: Person[] }>()
</script>

<template>
  <GorgCard>
    <template v-if="title" #title>{{ title }}</template>
    <template #header>
      <GorgButton variant="ghost" size="xs">
        <template #lead>
          <Icon name="lucide:user-plus" class="size-3.5" />
        </template>
        Invite
      </GorgButton>
    </template>

    <ul class="space-y-3">
      <li v-for="p in people" :key="p.name" class="flex items-center gap-3">
        <GorgAvatar :name="p.name" :src="p.src" :status="p.status" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-[var(--text-strong)]">{{ p.name }}</p>
          <p class="truncate text-xs text-[var(--text-muted)]">{{ p.role }}</p>
        </div>
        <GorgTooltip text="Message">
          <GorgButton variant="ghost" size="xs" aria-label="Message">
            <Icon name="lucide:message-square" class="size-4" />
          </GorgButton>
        </GorgTooltip>
      </li>
    </ul>
  </GorgCard>
</template>

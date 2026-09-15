<script setup lang="ts">
import { members } from '~/utils/mock'

useHead({ title: 'Members' })

const columns = [
  { key: 'name', label: 'Member', sortable: true, width: '22rem' },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'team', label: 'Team', sortable: true },
  { key: 'status', label: 'Status', align: 'center' as const },
  { key: 'usage', label: 'Usage', sortable: true, width: '10rem' },
  { key: 'joined', label: 'Joined', sortable: true, nowrap: true },
]

// Search, sort and pagination all live in the collection — including the
// "narrowing the list sends you back to page 1" rule.
const { query, sortKey, sortDirection, page, pageSize, visible, total } = useCollection(members, {
  searchFields: ['name', 'email', 'team', 'role'],
  initialSort: 'name',
  initialDirection: 'asc',
  pageSize: 10,
})

const statusTone = {
  active: 'positive',
  invited: 'info',
  suspended: 'critical',
} as const
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-[var(--text-strong)]">Members</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ total }} of {{ members.length }} people in this workspace.
        </p>
      </div>
      <GorgButton size="sm">
        <template #lead>
          <Icon name="lucide:user-plus" class="size-4" />
        </template>
        Invite member
      </GorgButton>
    </header>

    <GorgCard :padded="false">
      <!-- filters sit in one row above the table -->
      <div class="flex flex-wrap gap-3 border-b border-[var(--surface-border)] p-4">
        <GorgInput
          v-model="query"
          placeholder="Search name, email, team…"
          icon="lucide:search"
          clearable
          class="w-full sm:max-w-xs"
        />
      </div>

      <GorgTable
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :columns="columns"
        :rows="visible"
        row-key="id"
        hoverable
        striped
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <GorgAvatar :name="row.name" size="sm" />
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-strong)]">{{ row.name }}</p>
              <p class="truncate text-xs text-[var(--text-muted)]">{{ row.email }}</p>
            </div>
          </div>
        </template>

        <template #cell-role="{ value }">
          <GorgBadge :tone="value === 'Owner' ? 'brand' : 'neutral'" size="xs">{{ value }}</GorgBadge>
        </template>

        <template #cell-status="{ value }">
          <GorgBadge :tone="statusTone[value as keyof typeof statusTone]" size="xs" dot>
            {{ value }}
          </GorgBadge>
        </template>

        <template #cell-usage="{ value }">
          <GorgProgress :value="value" size="xs" show-value />
        </template>

        <template #empty>
          <GorgEmptyState
            icon="lucide:users"
            title="No members match"
            description="Try a different search term."
          />
        </template>
      </GorgTable>

      <div class="border-t border-[var(--surface-border)] p-4">
        <GorgPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="total"
          unit="members"
        />
      </div>
    </GorgCard>
  </div>
</template>

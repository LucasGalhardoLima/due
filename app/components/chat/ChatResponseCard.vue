<script setup lang="ts">
import { useChatDrawer } from '@/composables/useChatDrawer'
import { useChat } from '@/composables/useChat'
import type { ResponseCard } from '~/types/chat'

const props = defineProps<{
  card: ResponseCard
}>()

const emit = defineEmits<{
  actionClicked: [action: string, payload?: Record<string, unknown>]
}>()

const drawer = useChatDrawer()
const chat = useChat()

function handleAction(action: string, payload?: Record<string, unknown>) {
  if (action === 'open-drawer') {
    if (chat.pendingExpense.value) {
      drawer.openWithParsed(chat.pendingExpense.value)
      chat.clearPendingExpense()
    } else {
      drawer.openEmpty()
    }
  } else if (action === 'dismiss') {
    chat.clearPendingExpense()
  }
  emit('actionClicked', action, payload)
}
</script>

<template>
  <div class="mt-2 rounded-xl border border-border bg-card overflow-hidden">
    <!-- Card header -->
    <div class="px-4 py-3 border-b border-border/60">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {{ card.title }}
      </p>
    </div>

    <!-- Items (spending analysis rows, expense details, etc.) -->
    <div v-if="card.items?.length" class="px-4 py-3 flex flex-col gap-2.5">
      <div
        v-for="item in card.items"
        :key="item.label"
        class="flex items-center justify-between gap-3"
      >
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground truncate">{{ item.label }}</span>
            <span
              v-if="item.delta"
              class="text-xs font-medium shrink-0"
              :class="item.deltaPositive ? 'text-success' : 'text-destructive'"
            >
              {{ item.delta }}
            </span>
          </div>
          <!-- Bar (spending analysis) -->
          <div v-if="item.barPercent !== undefined" class="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${Math.max(0, Math.min(item.barPercent, 100))}%` }"
            />
          </div>
        </div>
        <span class="text-sm font-semibold shrink-0 tabular-nums">{{ item.value }}</span>
      </div>
    </div>

    <!-- Verdict -->
    <div v-if="card.verdict" class="px-4 pb-3">
      <p class="text-xs text-muted-foreground leading-relaxed">{{ card.verdict }}</p>
    </div>

    <!-- Actions -->
    <div v-if="card.actions?.length" class="px-4 pb-3 flex flex-wrap gap-2">
      <button
        v-for="action in card.actions"
        :key="action.label"
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        :class="action.action === 'open-drawer'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 active:scale-[0.97]'"
        @click="handleAction(action.action, action.payload)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

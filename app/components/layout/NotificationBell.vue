<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import NotificationPanel from '@/components/layout/NotificationPanel.vue'

const isPanelOpen = ref(false)

const { data: countData, refresh: refreshCount } = useFetch<{ unread: number }>('/api/notifications/count', {
  server: false,
  lazy: true,
})

const unreadCount = computed(() => countData.value?.unread ?? 0)

// Poll every 60s
let pollInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  pollInterval = setInterval(() => refreshCount(), 60_000)
  // Also refresh on window focus
  window.addEventListener('focus', refreshCount)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  window.removeEventListener('focus', refreshCount)
})

function handleOpen() {
  isPanelOpen.value = true
}

function handleClosed() {
  // Refresh count when panel closes
  refreshCount()
}
</script>

<template>
  <button
    class="relative flex items-center justify-center h-9 w-9 rounded-xl bg-background border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground"
    aria-label="Notificações"
    @click="handleOpen"
  >
    <Bell class="w-4 h-4" />
    <span
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white px-1"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </button>

  <NotificationPanel
    v-model:open="isPanelOpen"
    @closed="handleClosed"
  />
</template>

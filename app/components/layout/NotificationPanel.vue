<script setup lang="ts">
import { computed } from 'vue'
import { CheckCheck, Bell } from 'lucide-vue-next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  closed: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => {
    emit('update:open', val)
    if (!val) emit('closed')
  },
})

const { data, refresh } = useFetch<{ items: Notification[]; nextCursor: string | null }>(
  '/api/notifications',
  { query: { limit: 30 }, server: false, lazy: true }
)

const notifications = computed(() => data.value?.items ?? [])

// Refresh when panel opens
watch(isOpen, (val) => {
  if (val) refresh()
})

async function markAsRead(notification: Notification) {
  if (!notification.read) {
    await $fetch(`/api/notifications/${notification.id}`, {
      method: 'PATCH',
      body: { read: true },
    })
  }

  if (notification.actionUrl) {
    isOpen.value = false
    navigateTo(notification.actionUrl)
  }

  refresh()
}

async function markAllAsRead() {
  await $fetch('/api/notifications/read-all', { method: 'POST' })
  refresh()
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="right" class="w-full sm:max-w-md">
      <SheetHeader class="pb-4">
        <div class="flex items-center justify-between">
          <SheetTitle class="text-lg">Notificações</SheetTitle>
          <Button
            v-if="notifications.some(n => !n.read)"
            variant="ghost"
            size="sm"
            class="text-xs h-7 gap-1.5"
            @click="markAllAsRead"
          >
            <CheckCheck class="w-3.5 h-3.5" />
            Marcar todas como lidas
          </Button>
        </div>
      </SheetHeader>

      <div class="overflow-y-auto -mx-6 px-6 flex-1">
        <!-- Empty State -->
        <div v-if="notifications.length === 0">
          <EmptyState
            :icon="Bell"
            title="Tudo tranquilo por aqui!"
            description="Sem notificações no momento. Quando algo importante rolar, eu te aviso."
          />
        </div>

        <!-- Notification List -->
        <div v-else class="space-y-1">
          <button
            v-for="n in notifications"
            :key="n.id"
            class="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
            :class="!n.read ? 'bg-primary/5 border-l-2 border-primary' : ''"
            @click="markAsRead(n)"
          >
            <DuAvatar size="xs" :variant="!n.read ? 'primary' : 'muted'" class="mt-0.5" />
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-sm font-semibold truncate" :class="!n.read ? 'text-foreground' : 'text-muted-foreground'">
                  {{ n.title }}
                </p>
                <span class="text-[10px] text-muted-foreground shrink-0">
                  {{ timeAgo(n.createdAt) }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                {{ n.message }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const chat = useChat()
const requested = ref(false)
const granted = ref(false)
const denied = ref(false)

async function requestNotification() {
  if (!('Notification' in window)) {
    requested.value = true
    return
  }
  const permission = await Notification.requestPermission()
  granted.value = permission === 'granted'
  denied.value = permission === 'denied'
  requested.value = true
}

function waitHere() {
  chat.dismissNotificationPrompt()
}
</script>

<template>
  <div class="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-3">
    <!-- Header row -->
    <div class="flex items-start gap-3">
      <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <span class="text-sm" aria-hidden="true">⏳</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold leading-snug">Análise em andamento</p>
        <p class="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Isso pode levar até 30 segundos. Posso te avisar quando terminar.
        </p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="h-1 rounded-full bg-border overflow-hidden">
      <div class="h-full w-full rounded-full bg-primary origin-left animate-[indeterminate_1.8s_ease-in-out_infinite]" />
    </div>

    <!-- Actions -->
    <div v-if="!requested" class="flex flex-col gap-2">
      <button
        type="button"
        class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="requestNotification"
      >
        🔔 Me avise quando terminar
      </button>
      <button
        type="button"
        class="w-full rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/80 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="waitHere"
      >
        Aguardar aqui
      </button>
      <p class="text-center text-[10px] text-muted-foreground/70">
        Notificação do navegador, funciona mesmo com a aba minimizada
      </p>
    </div>

    <p v-else class="text-xs text-center text-muted-foreground">
      {{ granted ? '✓ Você será notificado quando terminar' : denied ? 'Notificações bloqueadas. O resultado aparecerá aqui.' : 'Aguardando resultado…' }}
    </p>
  </div>
</template>

<style scoped>
@keyframes indeterminate {
  0%   { transform: translateX(-100%) scaleX(0.5); }
  50%  { transform: translateX(0%) scaleX(0.8); }
  100% { transform: translateX(100%) scaleX(0.5); }
}
</style>

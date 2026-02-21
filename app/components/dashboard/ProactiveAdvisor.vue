<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { X, MessageCircle, AlertTriangle, PartyPopper, Bot } from 'lucide-vue-next'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

const advisor = useProactiveAdvisor()

// Controls the Transition visibility (separate from advisor.hasMessage so animation completes)
const showToast = ref(false)

// Auto-dismiss timer
let autoDismissTimer: ReturnType<typeof setTimeout> | undefined

const AUTO_DISMISS_MS: Record<string, number | null> = {
  low: 8000,
  medium: 12000,
  high: null, // manual only
}

function startAutoDismiss() {
  clearAutoDismiss()
  const priority = advisor.currentMessage.value?.priority || 'low'
  const delay = AUTO_DISMISS_MS[priority]
  if (delay) {
    autoDismissTimer = setTimeout(() => {
      showToast.value = false
    }, delay)
  }
}

function clearAutoDismiss() {
  if (autoDismissTimer !== undefined) {
    clearTimeout(autoDismissTimer)
    autoDismissTimer = undefined
  }
}

// Tone-based styling
const toneConfig = computed(() => {
  const tone = advisor.currentMessage.value?.tone || 'neutral'

  const configs = {
    curious: {
      bg: 'bg-info-muted',
      border: 'border-info/20',
      iconBg: 'bg-info/20',
      iconColor: 'text-info',
      shadow: 'shadow-info-glow',
      icon: MessageCircle
    },
    warning: {
      bg: 'bg-warning-muted',
      border: 'border-warning/20',
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
      shadow: 'shadow-warning-glow',
      icon: AlertTriangle
    },
    congratulatory: {
      bg: 'bg-success-muted',
      border: 'border-success/20',
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      shadow: 'shadow-success-glow',
      icon: PartyPopper
    },
    neutral: {
      bg: 'bg-muted',
      border: 'border-border',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      shadow: 'shadow-elevation-2',
      icon: Bot
    }
  }

  return configs[tone]
})

// Show toast when message arrives
watch(() => advisor.hasMessage.value, (has) => {
  if (has) {
    showToast.value = true
    startAutoDismiss()
  }
}, { immediate: true })

function handleDismiss() {
  clearAutoDismiss()
  showToast.value = false
}

function handleAction() {
  handleDismiss()
}

function onAfterLeave() {
  advisor.dismiss()
}

onUnmounted(() => {
  clearAutoDismiss()
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        name="advisor-slide"
        @after-leave="onAfterLeave"
      >
        <div
          v-if="showToast && advisor.hasMessage.value"
          role="status"
          aria-live="polite"
          class="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm sm:w-full z-50"
        >
          <div
            class="rounded-lg border p-4 transition-colors"
            :class="[
              toneConfig.bg,
              toneConfig.border,
              toneConfig.shadow,
            ]"
          >
            <!-- Row: Du avatar + message + close -->
            <div class="flex items-start gap-3">
              <!-- Du Avatar -->
              <DuAvatar size="sm" variant="primary" />

              <!-- Message -->
              <p class="flex-1 min-w-0 text-sm leading-relaxed">
                {{ advisor.currentMessage.value?.message }}
              </p>

              <!-- Close button — 44px touch target -->
              <button
                class="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Fechar"
                @click="handleDismiss"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Action button (if provided) -->
            <div v-if="advisor.currentMessage.value?.action" class="mt-3 pl-11">
              <Button
                variant="secondary"
                size="sm"
                class="h-auto min-h-7 py-1 px-3 text-xs whitespace-normal text-left justify-start"
                @click="handleAction"
              >
                {{ advisor.currentMessage.value.action.text }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.advisor-slide-enter-active,
.advisor-slide-leave-active {
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.advisor-slide-enter-from,
.advisor-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .advisor-slide-enter-active,
  .advisor-slide-leave-active {
    transition: none;
  }
}

/* Tone-specific glow shadows */
.shadow-warning-glow {
  box-shadow: 0 4px 14px -3px hsl(var(--warning) / 0.2), 0 2px 6px -2px hsl(var(--warning) / 0.1);
}
.shadow-success-glow {
  box-shadow: 0 4px 14px -3px hsl(var(--success) / 0.2), 0 2px 6px -2px hsl(var(--success) / 0.1);
}
.shadow-info-glow {
  box-shadow: 0 4px 14px -3px hsl(var(--info) / 0.2), 0 2px 6px -2px hsl(var(--info) / 0.1);
}
</style>

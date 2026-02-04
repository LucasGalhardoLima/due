<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, MessageCircle, AlertTriangle, PartyPopper, Bot } from 'lucide-vue-next'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

defineProps<{
  compact?: boolean
}>()

const advisor = useProactiveAdvisor()

// Tone-based styling
const toneConfig = computed(() => {
  const tone = advisor.currentMessage.value?.tone || 'neutral'

  const configs = {
    curious: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
      icon: MessageCircle
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      icon: AlertTriangle
    },
    congratulatory: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-500',
      icon: PartyPopper
    },
    neutral: {
      bg: 'bg-muted/50',
      border: 'border-border',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      icon: Bot
    }
  }

  return configs[tone]
})

// Priority-based animation
const priorityClass = computed(() => {
  const priority = advisor.currentMessage.value?.priority
  if (priority === 'high') return 'animate-pulse'
  return ''
})

function handleDismiss() {
  advisor.dismiss()
}
</script>

<template>
  <!-- Loading State -->
  <Card
    v-if="advisor.isLoading.value"
    class="overflow-hidden border-border/50 bg-muted/30"
    :class="{ 'p-3': compact, 'p-4': !compact }"
  >
    <div class="flex items-start gap-3">
      <div class="h-8 w-8 rounded-lg bg-muted animate-pulse shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div class="h-3 w-1/2 bg-muted rounded animate-pulse" />
      </div>
    </div>
  </Card>

  <!-- Message State -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-95"
  >
    <Card
      v-if="advisor.hasMessage.value && !advisor.isLoading.value"
      class="overflow-hidden relative"
      :class="[
        toneConfig.bg,
        toneConfig.border,
        priorityClass,
        compact ? 'p-3' : 'p-4'
      ]"
    >
      <!-- Dismiss Button -->
      <button
        class="absolute top-2 right-2 p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors z-10"
        aria-label="Fechar"
        @click="handleDismiss"
      >
        <X class="w-3.5 h-3.5" />
      </button>

      <div class="flex items-start gap-3 pr-6">
        <!-- Icon -->
        <div
          class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          :class="[toneConfig.iconBg]"
        >
          <component
            :is="toneConfig.icon"
            class="w-4 h-4"
            :class="[toneConfig.iconColor]"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 space-y-2">
          <!-- Message -->
          <p
            class="text-sm leading-relaxed"
            :class="{ 'text-small': compact }"
          >
            {{ advisor.currentMessage.value?.message }}
          </p>

          <!-- Action Button (if provided) -->
          <Button
            v-if="advisor.currentMessage.value?.action"
            variant="secondary"
            size="sm"
            class="h-auto min-h-7 py-1 px-3 text-xs whitespace-normal text-left justify-start"
          >
            {{ advisor.currentMessage.value.action.text }}
          </Button>
        </div>
      </div>

      <!-- Trigger Type Badge (for debugging/context) -->
      <div
        v-if="!compact"
        class="mt-3 pt-2 border-t border-current/10"
      >
        <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
          {{
            advisor.currentMessage.value?.triggerType === 'morning_check' ? 'Resumo do dia' :
            advisor.currentMessage.value?.triggerType === 'post_transaction' ? 'Sobre seu gasto' :
            advisor.currentMessage.value?.triggerType === 'pre_fechamento' ? 'Fechamento próximo' :
            'Dica'
          }}
        </span>
      </div>
    </Card>
  </Transition>
</template>

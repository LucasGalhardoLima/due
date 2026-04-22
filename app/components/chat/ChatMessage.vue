<script setup lang="ts">
import ChatResponseCard from './ChatResponseCard.vue'
import ChatNotificationPrompt from './ChatNotificationPrompt.vue'
import type { ChatMessage } from '~/types/chat'

defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  selectChip: [message: string]
}>()
</script>

<template>
  <!-- Notification prompt card (special full-width message) -->
  <div v-if="message.notificationPrompt" class="px-4 py-2">
    <ChatNotificationPrompt />
  </div>

  <!-- User message -->
  <div v-else-if="message.role === 'user'" class="flex justify-end px-4 py-1">
    <div class="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5">
      <p class="text-sm leading-relaxed text-secondary-foreground">{{ message.content }}</p>
    </div>
  </div>

  <!-- Assistant message -->
  <div v-else class="flex items-start gap-3 px-4 py-1">
    <!-- ✦ avatar -->
    <div class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
      <span class="text-xs font-bold leading-none select-none" aria-hidden="true">✦</span>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-2">
      <!-- Typing indicator -->
      <div v-if="message.isTyping" role="status" aria-label="Du está digitando" class="flex items-center gap-1 py-1">
        <span v-for="i in 3" :key="i" class="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" :style="{ animationDelay: `${(i - 1) * 150}ms` }" />
      </div>

      <!-- Prose content -->
      <p v-else-if="message.content" class="text-sm leading-relaxed">{{ message.content }}</p>

      <!-- Rich card -->
      <ChatResponseCard v-if="message.card && !message.isTyping" :card="message.card" />

      <!-- Follow-up chips -->
      <div v-if="message.followUpChips?.length && !message.isTyping" class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="chip in message.followUpChips"
          :key="chip"
          type="button"
          class="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/30 active:scale-[0.97] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          @click="emit('selectChip', chip)"
        >
          {{ chip }}
        </button>
      </div>
    </div>
  </div>
</template>

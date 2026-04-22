<script setup lang="ts">
import { useChatContext } from '@/composables/useChatContext'
import { useChat } from '@/composables/useChat'
const chat = useChat()

const emit = defineEmits<{
  selectSuggestion: [message: string]
}>()

const props = defineProps<{
  userName?: string
}>()

const { suggestions, greeting } = useChatContext()

const displayName = computed(() => props.userName ?? 'você')
</script>

<template>
  <div class="flex flex-col gap-5 p-4">
    <!-- Greeting -->
    <div class="flex flex-col gap-1">
      <p class="text-sm text-muted-foreground">{{ greeting }}.</p>
      <p class="text-base font-medium leading-snug">
        👋 Oi, {{ displayName }}! O que posso fazer por você?
      </p>
    </div>

    <!-- Suggestion chips -->
    <div class="flex flex-col gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.message"
        type="button"
        :disabled="chat.isStreaming.value"
        class="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted hover:border-primary/30 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('selectSuggestion', suggestion.message)"
      >
        {{ suggestion.label }}
      </button>
    </div>
  </div>
</template>

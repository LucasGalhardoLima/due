<!-- app/components/chat/ChatThread.vue -->
<script setup lang="ts">
import ChatMessage from './ChatMessage.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import { useChat } from '@/composables/useChat'

const emit = defineEmits<{
  selectSuggestion: [message: string]
}>()

const props = defineProps<{
  userName?: string
}>()

const chat = useChat()
const threadEl = ref<HTMLElement | null>(null)

const isEmpty = computed(() => chat.thread.value.length === 0)

watch(
  () => chat.thread.value.length,
  async () => {
    await nextTick()
    if (threadEl.value) {
      threadEl.value.scrollTop = threadEl.value.scrollHeight
    }
  }
)
</script>

<template>
  <div ref="threadEl" class="flex-1 overflow-y-auto overscroll-contain py-2 scroll-smooth">
    <!-- Opening state -->
    <ChatSuggestions
      v-if="isEmpty"
      :user-name="props.userName"
      @select-suggestion="emit('selectSuggestion', $event)"
    />

    <!-- Message thread -->
    <div v-else class="flex flex-col gap-1 pb-4">
      <ChatMessage
        v-for="msg in chat.thread.value"
        :key="msg.id"
        :message="msg"
        @select-chip="emit('selectSuggestion', $event)"
      />
    </div>
  </div>
</template>

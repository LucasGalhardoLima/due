<!-- app/components/chat/ChatInput.vue -->
<script setup lang="ts">
import { useChat } from '@/composables/useChat'
import { Send } from 'lucide-vue-next'

const chat = useChat()
const inputEl = ref<HTMLTextAreaElement | null>(null)

const localInput = ref('')

// When pendingInput is set externally (preloaded message), sync it
watch(
  () => chat.pendingInput.value,
  (val) => {
    if (val) {
      localInput.value = val
      nextTick(() => inputEl.value?.focus())
    }
  },
  { immediate: true }
)

const props = defineProps<{
  tabContext?: string
}>()

function submit() {
  const msg = localInput.value.trim()
  if (!msg || chat.isStreaming.value) return
  localInput.value = ''
  chat.send(msg, props.tabContext)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="border-t border-border px-4 py-3">
    <div class="flex items-end gap-2 rounded-xl bg-muted/50 border border-border px-3 py-2 focus-within:border-primary/50 transition-colors">
      <textarea
        ref="inputEl"
        v-model="localInput"
        rows="1"
        placeholder="Pergunte algo ao Du…"
        class="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 max-h-32 overflow-y-auto"
        :disabled="chat.isStreaming.value"
        @keydown="handleKeydown"
        @input="($event.target as HTMLTextAreaElement).style.height = 'auto'; ($event.target as HTMLTextAreaElement).style.height = ($event.target as HTMLTextAreaElement).scrollHeight + 'px'"
      />
      <button
        type="button"
        :disabled="!localInput.trim() || chat.isStreaming.value"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 active:scale-[0.95] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Enviar mensagem"
        @click="submit"
      >
        <Send class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

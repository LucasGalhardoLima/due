<!-- app/components/chat/ChatPanel.vue -->
<script setup lang="ts">
import { Sheet, SheetContent } from '@/components/ui/sheet'
import ChatThread from './ChatThread.vue'
import ChatInput from './ChatInput.vue'
import { useChat } from '@/composables/useChat'
import { useChatContext } from '@/composables/useChatContext'
import { X } from 'lucide-vue-next'

const chat = useChat()
const { contextKey } = useChatContext()

function handleSelectSuggestion(message: string) {
  chat.send(message, contextKey.value)
}
</script>

<template>
  <!-- Desktop only: lg+ -->
  <ClientOnly>
    <Sheet :open="chat.isOpen.value" @update:open="(v) => v ? chat.open() : chat.close()">
      <SheetContent
        side="right"
        class="hidden lg:flex w-[420px] flex-col p-0 gap-0 border-l border-border bg-background"
      >
        <!-- Header -->
        <div class="flex items-center gap-2.5 border-b border-border px-5 py-4 shrink-0">
          <span class="text-xl leading-none select-none" aria-hidden="true">✦</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-extrabold leading-tight tracking-tight">Du</p>
            <p class="text-[11px] text-muted-foreground leading-none mt-0.5">Seu coach financeiro</p>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Fechar Du Chat"
            @click="chat.close()"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Thread -->
        <ChatThread
          class="flex-1 min-h-0"
          @select-suggestion="handleSelectSuggestion"
        />

        <!-- Input -->
        <ChatInput :tab-context="contextKey" />
      </SheetContent>
    </Sheet>
  </ClientOnly>
</template>

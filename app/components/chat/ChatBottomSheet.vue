<!-- app/components/chat/ChatBottomSheet.vue -->
<script setup lang="ts">
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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
  <!-- Mobile only: < lg -->
  <ClientOnly>
    <Drawer :open="chat.isOpen.value" @update:open="(v) => v ? chat.open() : chat.close()">
      <DrawerContent class="flex flex-col h-[92dvh] p-0 gap-0">
        <!-- Header -->
        <DrawerHeader class="flex items-center gap-2.5 border-b border-border px-5 py-4 shrink-0">
          <span class="text-xl leading-none select-none" aria-hidden="true">✦</span>
          <DrawerTitle class="flex-1 min-w-0 text-left">
            <span class="text-sm font-extrabold leading-tight tracking-tight">Du</span>
            <span class="block text-[11px] text-muted-foreground leading-none mt-0.5 font-normal">Seu coach financeiro</span>
          </DrawerTitle>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Fechar Du Chat"
            @click="chat.close()"
          >
            <X class="h-4 w-4" />
          </button>
        </DrawerHeader>

        <!-- Thread -->
        <ChatThread
          class="flex-1 min-h-0"
          @select-suggestion="handleSelectSuggestion"
        />

        <!-- Input -->
        <ChatInput :tab-context="contextKey" />
      </DrawerContent>
    </Drawer>
  </ClientOnly>
</template>

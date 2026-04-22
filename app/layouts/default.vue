<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import ChatFab from '@/components/chat/ChatFab.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import ChatBottomSheet from '@/components/chat/ChatBottomSheet.vue'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import { useChatDrawer } from '@/composables/useChatDrawer'

const chatDrawer = useChatDrawer()
</script>

<template>
  <div class="app-shell min-h-screen bg-background antialiased relative overflow-hidden">
    <DemoBanner />

    <div class="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 lg:pl-[19.5rem] pb-20 lg:pb-8 relative z-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        <slot />
      </main>
    </div>

    <BottomNav />

    <!-- Du Chat FAB + Panel -->
    <ChatFab />
    <ChatPanel />
    <ChatBottomSheet />

    <!-- Chat-driven expense drawer (separate from dashboard's drawer) -->
    <TransactionDrawer
      :open="chatDrawer.isOpen.value"
      :prefilled="chatDrawer.prefilled.value"
      @update:open="(v) => { if (!v) chatDrawer.close() }"
      @saved="chatDrawer.close()"
    />

    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>

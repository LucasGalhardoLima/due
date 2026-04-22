<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const { isOpen, open, close } = useChat()
const route = useRoute()

const shouldShow = computed(() => route.path !== '/onboarding')
const showTooltip = ref(false)

function toggle() {
  dismissTooltip()
  if (isOpen.value) close()
  else open()
}

function dismissTooltip() {
  if (!showTooltip.value) return
  showTooltip.value = false
  localStorage.setItem('du-chat-seen', '1')
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if ((event.key === 'a' || event.key === 'A') && shouldShow.value) {
    event.preventDefault()
    toggle()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (!localStorage.getItem('du-chat-seen')) {
    showTooltip.value = true
    setTimeout(dismissTooltip, 5000)
  }
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <ClientOnly>
    <Transition name="fab-pop">
      <div v-if="shouldShow" class="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
        <!-- First-visit tooltip -->
        <Transition name="tooltip-pop">
          <div
            v-if="showTooltip"
            class="flex items-center gap-2 rounded-2xl bg-ai-accent px-4 py-2.5 shadow-lg max-w-[220px] cursor-pointer"
            @click="dismissTooltip"
          >
            <span class="text-sm font-medium text-ai-accent-foreground leading-snug">Pergunte qualquer coisa sobre suas finanças</span>
          </div>
        </Transition>

        <button
          class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ai-accent text-ai-accent-foreground shadow-[0_0_24px_hsl(var(--ai-accent)/0.4)] hover:shadow-[0_0_32px_hsl(var(--ai-accent)/0.6)] hover:scale-105 active:scale-[0.97] transition-all duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-accent/50"
          :aria-label="isOpen ? 'Fechar Du Chat' : 'Abrir Du Chat'"
          :aria-expanded="isOpen"
          @click="toggle"
        >
          <span class="text-xl font-bold leading-none select-none" aria-hidden="true">✦</span>
        </button>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
.fab-pop-enter-active,
.fab-pop-leave-active {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out;
}
.fab-pop-enter-from,
.fab-pop-leave-to {
  transform: scale(0.6);
  opacity: 0;
}

.tooltip-pop-enter-active {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out;
}
.tooltip-pop-leave-active {
  transition: transform 180ms ease-in, opacity 150ms ease-in;
}
.tooltip-pop-enter-from,
.tooltip-pop-leave-to {
  transform: translateY(8px) scale(0.95);
  opacity: 0;
}
</style>

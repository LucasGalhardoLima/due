<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const { isOpen, open, close } = useChat()
const route = useRoute()

const shouldShow = computed(() => route.path !== '/onboarding')

function toggle() {
  if (isOpen.value) close()
  else open()
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

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <ClientOnly>
    <Transition name="fab-pop">
      <button
        v-if="shouldShow"
        class="fixed bottom-8 right-8 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.6)] hover:scale-105 active:scale-[0.97] transition-all duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        :aria-label="isOpen ? 'Fechar Du Chat' : 'Abrir Du Chat'"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <span class="text-xl font-bold leading-none select-none" aria-hidden="true">✦</span>
      </button>
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
</style>

<script setup lang="ts">
import { PlusCircle } from 'lucide-vue-next'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'

const isDrawerOpen = ref(false)

const route = useRoute()

const shouldShowFab = computed(() => {
  return route.path !== '/onboarding'
})

function openDrawer() {
  isDrawerOpen.value = true
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return
  if (event.ctrlKey || event.metaKey || event.altKey) return

  if (event.key === 'a' || event.key === 'A') {
    if (shouldShowFab.value && !isDrawerOpen.value) {
      event.preventDefault()
      openDrawer()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div v-if="shouldShowFab" class="fixed bottom-8 right-8 z-50">
    <button
      class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 hover:scale-110 transition-all duration-300 active:scale-[0.97]"
      aria-label="Adicionar nova despesa"
      @click="openDrawer"
    >
      <PlusCircle class="h-8 w-8" aria-hidden="true" />
    </button>
    <TransactionDrawer v-model:open="isDrawerOpen" />
  </div>
</template>

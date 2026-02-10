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

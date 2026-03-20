<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import AIInsightsModal from '@/components/dashboard/AIInsightsModal.vue'

const props = defineProps<{
  month?: number
  year?: number
}>()

const isModalOpen = ref(false)
const currentDate = new Date()
</script>

<template>
  <button
    class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-ai-accent/20 bg-muted hover:border-ai-accent/35 hover:bg-muted/80 transition-all duration-200 active:scale-[0.98] cursor-pointer text-left group"
    @click="isModalOpen = true"
  >
    <DuAvatar size="sm" variant="ai-accent" />
    <span class="flex-1 text-sm font-bold tracking-tight">Consultor Du</span>
    <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider bg-ai-accent text-ai-accent-foreground">
      BETA
    </span>
    <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
  </button>

  <AIInsightsModal
    v-model:open="isModalOpen"
    :month="props.month || (currentDate.getMonth() + 1)"
    :year="props.year || currentDate.getFullYear()"
  />
</template>

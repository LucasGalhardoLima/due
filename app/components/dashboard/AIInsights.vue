<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import AIInsightsModal from '@/components/dashboard/AIInsightsModal.vue'

// Props to receive context from parent (optional, but good for month/year)
const props = defineProps<{
  month?: number
  year?: number
}>()

const isModalOpen = ref(false)
const currentDate = new Date()
</script>

<template>
  <div class="contents">
      <!-- Trigger Card (Vertical Sidebar Style) -->
      <Card
        class="relative overflow-hidden group transition-all duration-500 border-ai-accent/20 bg-muted cursor-pointer hover:border-ai-accent/35 active:scale-[0.98]"
        @click="isModalOpen = true"
      >
        <!-- Content -->
        <div class="p-5 md:p-6 relative z-10 flex flex-col gap-4 text-left">
           <!-- Header Group -->
           <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <DuAvatar size="md" variant="ai-accent" />
                <h3 class="text-h3 font-black tracking-tight">Consultor Du</h3>
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider bg-ai-accent text-ai-accent-foreground">
                  BETA
                </span>
              </div>
              <p class="text-small text-muted-foreground leading-relaxed">
                Análise rápida do mês ou profunda com 6 meses de histórico.
              </p>
           </div>

           <!-- Action Button -->
           <Button
            size="default"
            class="w-full font-bold h-10 rounded-lg bg-ai-accent text-ai-accent-foreground hover:bg-ai-accent/90 transition-all pointer-events-none shadow-elevation-3"
           >
            Fala, Du!
           </Button>
        </div>
      </Card>

      <!-- The Modal -->
      <AIInsightsModal 
        v-model:open="isModalOpen"
        :month="props.month || (currentDate.getMonth() + 1)"
        :year="props.year || currentDate.getFullYear()"
      />
  </div>
</template>

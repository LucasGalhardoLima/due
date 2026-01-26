<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
        @click="isModalOpen = true"
        class="relative overflow-hidden group transition-all duration-500 border-primary/20 bg-primary/5 dark:bg-primary/10 cursor-pointer hover:bg-primary/10 active:scale-[0.98]"
        glow="primary"
      >
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        <div class="absolute -left-20 -bottom-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        
        <!-- Content -->
        <div class="p-5 md:p-6 relative z-10 flex flex-col gap-4 text-left">
           <!-- Header Group -->
           <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-glass ring-1 ring-primary/30">
                  <Sparkles class="w-4.5 h-4.5" />
                </div>
                <h3 class="text-h3 font-black tracking-tight">Consultor IA</h3>
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider bg-primary text-primary-foreground shadow-primary-glow animate-pulse">
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
            class="w-full font-bold shadow-primary-glow h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all pointer-events-none"
           >
            Abrir Consultor
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

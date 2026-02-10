<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
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
        class="relative overflow-hidden group transition-all duration-500 border-ai-accent/30 bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.16),hsl(var(--secondary)/0.08))] dark:bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.26),hsl(var(--secondary)/0.20))] cursor-pointer hover:border-ai-accent/45 active:scale-[0.98]"
        @click="isModalOpen = true"
      >
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-ai-accent/10 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        <div class="absolute -left-20 -bottom-20 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

        <!-- Content -->
        <div class="p-5 md:p-6 relative z-10 flex flex-col gap-4 text-left">
           <!-- Header Group -->
           <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="h-9 w-9 rounded-xl bg-ai-accent/20 flex items-center justify-center text-ai-accent shadow-elevation-1 ring-1 ring-ai-accent/30">
                  <Sparkles class="w-4.5 h-4.5" />
                </div>
                <h3 class="text-h3 font-black tracking-tight">Consultor IA</h3>
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

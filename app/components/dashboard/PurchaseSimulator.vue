<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import PurchaseSimulatorModal from '@/components/dashboard/PurchaseSimulatorModal.vue'

const props = defineProps<{
  cardId: string
  cardName: string
}>()

const isModalOpen = ref(false)
</script>

<template>
  <div class="contents">
    <!-- Trigger Card -->
    <Card
      @click="isModalOpen = true"
      class="relative overflow-hidden group transition-all duration-500 border-primary/20 bg-primary/5 dark:bg-primary/10 cursor-pointer hover:bg-primary/10 active:scale-[0.98]"
      glow="primary"
    >
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
      <div class="absolute -left-20 -bottom-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
      
      <!-- Content -->
      <div class="p-5 md:p-6 relative z-10 flex flex-col gap-4 text-left">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-glass ring-1 ring-primary/30">
                <Sparkles class="w-4.5 h-4.5" />
              </div>
              <h3 class="text-h3 font-black tracking-tight">Simular Compra</h3>
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider bg-primary text-primary-foreground shadow-primary-glow animate-pulse">
                AI BETA
              </span>
            </div>
            <p class="text-small text-muted-foreground leading-relaxed">
              Use nossa IA para avaliar se uma compra cabe no seu orçamento.
            </p>
          </div>
          <Button 
            size="default" 
            class="w-full font-bold shadow-primary-glow h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all pointer-events-none"
          >
            Abrir Simulador
          </Button>
      </div>
    </Card>
 
    <!-- Modal -->
    <PurchaseSimulatorModal 
        v-model:open="isModalOpen"
        :card-id="props.cardId"
        :card-name="props.cardName"
    />
  </div>
</template>

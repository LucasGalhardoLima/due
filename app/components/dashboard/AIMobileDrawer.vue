<script setup lang="ts">
import { computed } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { X } from 'lucide-vue-next'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import AIInsights from '@/components/dashboard/AIInsights.vue'
import PurchaseSimulator from '@/components/dashboard/PurchaseSimulator.vue'
import ProactiveAdvisor from '@/components/dashboard/ProactiveAdvisor.vue'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

const advisor = useProactiveAdvisor()

const props = defineProps<{
  open: boolean
  selectedCardId?: string
  cardName?: string
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="bg-background border-t border-border max-h-[90vh]">
      <div class="mx-auto w-full max-w-md flex flex-col h-full">
        <DrawerHeader class="text-left relative pb-0">
          <div class="flex items-center gap-2 mb-2">
            <DuAvatar size="sm" variant="ai-accent" />
            <DrawerTitle class="text-h3">Assistente Du</DrawerTitle>
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider bg-primary text-primary-foreground">
              BETA
            </span>
          </div>
          <DrawerDescription>
            Ferramentas inteligentes para sua vida financeira.
          </DrawerDescription>
          
          <DrawerClose class="absolute top-4 right-4 p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-foreground" as-child>
             <button>
               <X class="w-4 h-4" />
             </button>
          </DrawerClose>
        </DrawerHeader>

        <div class="p-4 space-y-6 overflow-y-auto flex-1">
          <!-- Proactive Advisor (Mobile) -->
          <ProactiveAdvisor v-if="advisor.hasMessage.value || advisor.isLoading.value" compact />

          <!-- AI Insights -->
          <div class="space-y-2">
            <h4 class="text-small font-black text-muted-foreground uppercase tracking-wider ml-1">Análise Geral</h4>
            <AIInsights />
          </div>

          <!-- Purchase Simulator -->
          <div v-if="selectedCardId" class="space-y-2">
            <h4 class="text-small font-black text-muted-foreground uppercase tracking-wider ml-1">Simular Compra</h4>
            <PurchaseSimulator 
                :card-id="selectedCardId"
                :card-name="cardName || ''"
            />
          </div>
          
          <div v-else class="p-4 rounded-xl border border-dashed text-center text-muted-foreground text-small">
            Selecione um cartão no topo para habilitar o simulador de compras.
          </div>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>

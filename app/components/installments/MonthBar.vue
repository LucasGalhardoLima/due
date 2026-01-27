<script setup lang="ts">
import { ChevronDown, AlertTriangle } from 'lucide-vue-next'

// Types locally defined to avoid complex imports for now
interface TimelineTransaction {
  description: string
  amount: number
  installmentNumber: number
  totalInstallments: number
  category: string
}

interface TimelineData {
  label: string
  totalCommitted: number
  limitUsagePercent: number
  status: 'safe' | 'warning' | 'danger'
  alert?: string
  transactions: TimelineTransaction[]
}

interface OverlayData {
  addedPercent: number
  newTotal: number
}

const props = defineProps<{
  data: TimelineData
  overlay?: OverlayData
}>()

const expanded = ref(false)

const statusColor = computed(() => {
  switch (props.data.status) {
    case 'safe': return 'bg-emerald-500/60'
    case 'warning': return 'bg-amber-500/60'
    case 'danger': return 'bg-rose-500/60'
    default: return 'bg-muted'
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>

<template>
  <div class="group relative">
    <!-- Main Bar Row -->
    <div 
      class="flex items-center gap-3 py-3 px-3 hover:bg-muted/40 rounded-xl transition-all cursor-pointer select-none"
      @click="expanded = !expanded"
    >
      <!-- Left: Date -->
      <div class="w-14 text-sm font-medium text-muted-foreground shrink-0 leading-tight">
        {{ data.label.split('/')[0] }}
        <span class="block text-xs opacity-70">/{{ data.label.split('/')[1] }}</span>
      </div>
      
      <!-- Middle: Bar Chart -->
      <div class="flex-1 h-3 bg-muted/20 rounded-full relative overflow-hidden">
        <!-- Base Usage -->
        <div 
          class="h-full rounded-full transition-all duration-700 ease-out"
          :class="statusColor"
          :style="{ width: `${Math.min(data.limitUsagePercent, 100)}%` }"
        ></div>
        
        <!-- Simulation Overlay -->
        <div 
          v-if="overlay"
          class="absolute top-0 h-full bg-primary/80 transition-all duration-500"
          :style="{ 
            left: `${Math.min(data.limitUsagePercent, 100)}%`,
            width: `${Math.min(overlay.addedPercent, 100 - data.limitUsagePercent)}%` 
          }"
        ></div>
      </div>
      
      <!-- Right: Value & Indicator -->
      <div class="text-right min-w-[90px] shrink-0">
        <div class="font-bold text-sm">
          {{ formatCurrency(data.totalCommitted + (overlay ? (overlay.newTotal - data.totalCommitted) : 0)) }}
        </div>
        <div class="flex items-center justify-end gap-1 text-[10px] text-muted-foreground uppercase font-semibold">
           <span v-if="overlay" class="text-primary">+{{ (overlay.addedPercent).toFixed(1) }}%</span>
           <span v-else>{{ data.limitUsagePercent.toFixed(1) }}% do limite</span>
        </div>
      </div>

      <!-- Icon -->
      <div class="w-6 flex justify-center shrink-0">
        <ChevronDown 
          class="w-4 h-4 text-muted-foreground transition-transform duration-300"
          :class="{ 'rotate-180': expanded }"
        />
      </div>
    </div>

    <!-- Expanded Details -->
    <div v-if="expanded" class="pl-[4.5rem] pr-4 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
      <div class="space-y-3 pt-2 border-l-2 border-muted/50 pl-4">
         <!-- Alert Banner -->
         <div v-if="data.alert" class="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-2 rounded-md text-xs font-medium">
           <AlertTriangle class="w-3 h-3 shrink-0" />
           {{ data.alert }}
         </div>

         <!-- Transaction List -->
         <div class="space-y-2">
           <div 
             v-for="(t, i) in data.transactions" 
             :key="i"
             class="flex justify-between items-center text-xs group/item"
           >
             <div class="flex items-center gap-2 overflow-hidden">
               <div class="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
               <span class="font-medium truncate text-foreground/80 group-hover/item:text-foreground transition-colors">
                 {{ t.description }}
               </span>
               <span class="text-muted-foreground/60 whitespace-nowrap text-[10px]">
                 ({{ t.installmentNumber }}/{{ t.totalInstallments }})
               </span>
             </div>
             <div class="font-mono text-muted-foreground group-hover/item:text-foreground transition-colors whitespace-nowrap ml-2">
               {{ formatCurrency(t.amount) }}
             </div>
           </div>
           
           <div v-if="data.transactions.length === 0" class="text-xs text-muted-foreground italic">
             Nenhum parcelamento neste mês.
           </div>
         </div>
      </div>
    </div>
  </div>
</template>

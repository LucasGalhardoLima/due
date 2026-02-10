<script setup lang="ts">
import { AlertTriangle, CalendarRange } from 'lucide-vue-next'
import MonthBar from './MonthBar.vue'

const { timeline, simulationState, timelineStatus } = useInstallments()

interface TimelineMonth {
  year: number
  month: number
  limitUsagePercent: number
  totalCommitted: number
}

// Helper to calculate overlay data for simulation
const getOverlay = (month: TimelineMonth) => {
  const result = simulationState.value.result as { timeline?: { after: TimelineMonth[] } } | null
  if (!result?.timeline?.after) return undefined

  const afterMonth = result.timeline.after.find((m) =>
    m.year === month.year && m.month === month.month
  )
  
  if (!afterMonth) return undefined
  
  const addedPercent = Math.max(0, afterMonth.limitUsagePercent - month.limitUsagePercent)
  
  // Only show if there's a meaningful difference
  if (addedPercent < 0.1) return undefined
  
  return {
    addedPercent,
    newTotal: afterMonth.totalCommitted
  }
}

// Check for any danger status
const hasDanger = computed(() => {
  return timeline.value?.months.some(m => m.status === 'danger')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <CalendarRange class="w-5 h-5" />
          Linha do Tempo
        </h3>
        <p class="text-sm text-muted-foreground">
          Projeção dos seus compromissos para os próximos 12 meses.
        </p>
      </div>
      
      <!-- Summaries / Legend could go here -->
      <div v-if="hasDanger" class="bg-danger/10 text-danger px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border border-danger/20 transition-all duration-200 hover:bg-danger/15">
        <AlertTriangle class="w-3 h-3" />
        Meses com alerta
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="timelineStatus === 'pending'" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-14 bg-muted/10 rounded-xl animate-pulse"/>
    </div>

    <!-- Timeline List -->
    <div v-else-if="timeline?.months" class="space-y-1">
      <MonthBar 
        v-for="monthData in timeline.months" 
        :key="monthData.label"
        :data="monthData"
        :overlay="getOverlay(monthData)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-10 text-muted-foreground">
      Nenhum dado encontrado.
    </div>
  </div>
</template>

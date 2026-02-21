<script setup lang="ts">
import { CalendarClock } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import DuAvatar from '@/components/ui/DuAvatar.vue'
import { toast } from 'vue-sonner'

interface TimelineItem {
  monthName: string
  commitment: number
  fixed: number
  projected: number
  status: 'ok' | 'warning' | 'critical'
}

interface TrendData {
    month: string
    amount: number
}

interface Alert {
  type: 'future_shortage' | 'spending_trend_alert'
  title?: string
  message?: string
  when?: string
  countdown_days?: number
  probability?: number
  analysis?: {
      causes: string[]
      trigger_event: string
      risk_factors: string[]
  }
  prevention?: {
      recommended: string
      option_1: { action: string; impact: string; difficulty: string }
      option_2: { action: string; impact: string; difficulty: string }
  }
  visualization?: {
      timeline?: TimelineItem[]
  }
  detected_pattern?: {
      trend: string
      percentage_growth: string
      data: TrendData[]
  }
  projection?: {
      next_3_months: { month: string, projected: number }[]
      outcome: string
  }
  recommendation?: {
      message: string
      actions: string[]
  }
}

defineProps<{
  alert: Alert
}>()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
}

const handleAction = (action: string) => {
  if (action === 'anticipate') {
    return navigateTo('/parcelamentos')
  }
  
  if (action === 'prevent') {
    toast.success('Compromisso registrado! Vamos evitar novos parcelamentos nos próximos 45 dias.')
  }
}
</script>

<template>
  <div class="bg-muted border rounded-2xl p-6 relative overflow-hidden group">
      <!-- Header -->
      <div class="flex items-start justify-between relative z-10 mb-6">
          <div class="flex items-center gap-3">
              <DuAvatar size="md" variant="primary" />
              <div>
                  <h3 class="text-body font-bold flex items-center gap-2">
                       {{ alert.title || 'Opa, olha só...' }}
                       <Badge v-if="alert.probability" variant="outline" class="text-[10px] h-5">Probabilidade: {{ (alert.probability * 100).toFixed(0) }}%</Badge>
                  </h3>
                  <p v-if="alert.countdown_days" class="text-small text-muted-foreground">
                      Previsto para daqui a <span class="font-bold text-foreground">{{ alert.countdown_days }} dias</span> ({{ new Date(alert.when!).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) }})
                  </p>
                  <p v-else class="text-small text-muted-foreground">
                      {{ alert.detected_pattern?.percentage_growth }}
                  </p>
              </div>
          </div>
      </div>

      <!-- CONTENT: Future Shortage -->
      <div v-if="alert.type === 'future_shortage'" class="space-y-6 relative z-10">
          <!-- Timeline Visualization -->
          <div class="glass-inset p-4 border-dashed">
             <div class="flex justify-between items-end h-[100px] mb-2 px-2 gap-3">
                 <div v-for="(item, idx) in alert.visualization?.timeline" :key="idx" class="flex flex-col items-center gap-2 w-full h-full group/bar">
                     <div class="relative w-full flex justify-center items-end flex-1">
                         <!-- Prediction Bar -->
                         <div 
                             class="w-full max-w-[24px] rounded-t-md transition-all duration-500 relative"
                             :class="{
                                 'bg-success/60': item.status === 'ok',
                                 'bg-warning/70': item.status === 'warning',
                                 'bg-danger': item.status === 'critical'
                             }"
                             :style="{ height: `${Math.max(8, Math.min(item.commitment, 100))}%` }"
                         >
                             <!-- Tooltip -->
                             <span class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-foreground text-background px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">
                                 {{ item.commitment.toFixed(0) }}%
                             </span>
                         </div>
                         <!-- Limit Line (approximate 100%) -->
                         <div v-if="item.commitment >= 100" class="absolute top-0 w-full border-t border-destructive border-dashed z-10"/>
                     </div>
                      <span
                         class="text-[10px] font-bold uppercase shrink-0"
                         :class="item.status === 'critical' ? 'text-danger' : 'text-muted-foreground'"
                      >
                         {{ item.monthName }}
                      </span>
                 </div>
             </div>
             <p class="text-micro text-center text-muted-foreground mt-2">
                 Projeção de comprometimento do limite
             </p>
          </div>
          
          <!-- Analysis Points -->
          <div class="space-y-2">
              <h4 class="text-micro font-bold text-muted-foreground uppercase tracking-wider">Causas Principais</h4>
              <ul class="space-y-1">
                  <li v-for="cause in alert.analysis?.causes" :key="cause" class="text-small text-muted-foreground flex items-baseline gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-destructive shrink-0"/>
                      {{ cause }}
                  </li>
              </ul>
          </div>

          <!-- Actions -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div 
                class="border rounded-2xl p-3 hover:bg-muted/50 transition-colors cursor-pointer group/opt"
                :class="alert.prevention?.recommended === 'option_1' ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''"
                @click="handleAction('prevent')"
              >
                  <p class="text-small font-bold mb-1 flex items-center justify-between">
                    Opção 1: Prevenção
                    <ArrowRight class="w-3 h-3 opacity-0 group-hover/opt:opacity-100 group-hover/opt:translate-x-1 transition-all" />
                  </p>
                  <p class="text-[11px] text-muted-foreground">{{ alert.prevention?.option_1?.action }}</p>
                  <div class="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" class="text-[10px] h-4">{{ alert.prevention?.option_1?.difficulty }}</Badge>
                      <span class="text-[10px] text-success font-medium">{{ alert.prevention?.option_1?.impact }}</span>
                  </div>
              </div>
              <div 
                class="border rounded-2xl p-3 hover:bg-muted/50 transition-colors cursor-pointer group/opt"
                :class="alert.prevention?.recommended === 'option_2' ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''"
                @click="handleAction('anticipate')"
              >
                  <p class="text-small font-bold mb-1 flex items-center justify-between">
                    Opção 2: Ação Imediata
                    <ArrowRight class="w-3 h-3 opacity-0 group-hover/opt:opacity-100 group-hover/opt:translate-x-1 transition-all" />
                  </p>
                  <p class="text-[11px] text-muted-foreground">{{ alert.prevention?.option_2?.action }}</p>
                  <div class="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" class="text-[10px] h-4">{{ alert.prevention?.option_2?.difficulty }}</Badge>
                      <span class="text-[10px] text-success font-medium">{{ alert.prevention?.option_2?.impact }}</span>
                  </div>
              </div>
           </div>
      </div>

      <!-- CONTENT: Spending Trend -->
      <div v-else class="space-y-6 relative z-10">
          
           <div class="flex items-end gap-1 h-[120px] w-full px-4">
               <div v-for="(d, i) in alert.detected_pattern?.data" :key="i" class="flex-1 h-full flex flex-col justify-end gap-2 group/bar">
                  <div class="w-full bg-primary/20 rounded-t-sm relative hover:bg-primary/40 transition-colors" :style="{ height: `${Math.max(5, (d.amount / 4000) * 100)}%` }">
                      <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {{ formatCurrency(d.amount) }}
                      </span>
                  </div>
                  <span class="text-[10px] text-center text-muted-foreground shrink-0">{{ d.month }}</span>
               </div>
               <!-- Projection -->
                 <div v-for="(p, j) in alert.projection?.next_3_months" :key="'p'+j" class="flex-1 h-full flex flex-col justify-end gap-2 opacity-50 border-l border-dashed pl-1">
                   <div class="w-full bg-danger/10 rounded-t-sm relative border-t-2 border-danger/20 border-dotted" :style="{ height: `${Math.max(5, (p.projected / 4000) * 100)}%` }"/>
                   <span class="text-[10px] text-center text-destructive shrink-0">{{ p.month }}?</span>
               </div>
           </div>
           
           <div class="bg-destructive/10 rounded-2xl p-4 border border-destructive/20">
               <div class="flex items-start gap-3">
                   <ShieldAlert class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                   <div>
                       <p class="text-small font-bold text-destructive mb-1">{{ alert.projection?.outcome }}</p>
                       <p class="text-small text-muted-foreground">{{ alert.recommendation?.message }}</p>
                   </div>
               </div>
           </div>

           <div class="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
               <span class="text-[10px] font-bold text-muted-foreground uppercase px-2">Ação:</span>
               <div class="flex flex-wrap gap-2">
                   <Badge 
                    v-for="act in alert.recommendation?.actions" 
                    :key="act" 
                    variant="outline" 
                    class="bg-background text-[11px] font-normal cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors"
                    @click="toast.info('Dica anotada: ' + act)"
                   >
                       {{ act }}
                   </Badge>
               </div>
           </div>
      </div>

  </div>
</template>

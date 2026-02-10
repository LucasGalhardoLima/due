<script setup lang="ts">
import { AlertCircle, CheckCircle2, XCircle, Activity, Sparkles } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface SubscriptionItem {
  name: string
  amount: number
  last_usage: string | null
  days_inactive: number
  alert?: string
  potential_saving?: number
  recommendation?: string
  status: 'active' | 'inactive' | 'redundant'
}

interface SubscriptionAnalysis {
  active_subscriptions: SubscriptionItem[]
  total_wasted: number
  annual_waste: number
  quick_wins: string[]
}

defineProps<{
  analysis: SubscriptionAnalysis
}>()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Hero / Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <!-- Wasted Money -->
       <div class="rounded-[2rem] border border-ai-accent/25 bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.12),hsl(var(--secondary)/0.08))] p-6 relative overflow-hidden shadow-elevation-2 transition-all duration-300 hover:shadow-elevation-3 hover:border-ai-accent/40 hover:-translate-y-[2px]">
          <div class="absolute right-0 top-0 w-32 h-32 bg-ai-accent/12 blur-3xl rounded-full"/>
          <p class="text-small font-medium text-destructive mb-1 uppercase tracking-wider flex items-center gap-2">
            <XCircle class="w-4 h-4" /> Desperdício Mensal
          </p>
          <h3 class="text-h1 text-destructive">{{ formatCurrency(analysis.total_wasted) }}</h3>
          <p class="text-small text-muted-foreground mt-2">
            Isso dá <span class="font-bold text-foreground">{{ formatCurrency(analysis.annual_waste) }}</span> por ano jogados fora.
          </p>
       </div>

       <!-- Quick Wins -->
       <div class="app-panel p-6 relative overflow-hidden hover:-translate-y-[2px]">
          <div class="absolute right-0 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"/>
             <p class="text-small font-medium text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
               <Sparkles class="w-4 h-4 ml-1" /> Quick Wins
            </p>
          <ul class="space-y-3">
             <li v-for="(win, idx) in analysis.quick_wins" :key="idx" class="flex items-center gap-3 text-body font-medium transition-all duration-200 hover:translate-x-0.5">
                <div class="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                    <CheckCircle2 class="w-4 h-4" />
                </div>
                {{ win }}
             </li>
             <li v-if="analysis.quick_wins.length === 0" class="text-muted-foreground text-small">
               Nenhuma oportunidade óbvia encontrada. Parabéns!
             </li>
          </ul>
       </div>
    </div>

    <!-- Subscriptions List -->
    <div class="space-y-4">
        <h2 class="text-h3 flex items-center gap-2">
            <Activity class="w-5 h-5 text-primary" />
            Suas Assinaturas
        </h2>
        
        <div class="grid grid-cols-1 gap-4">
            <div 
              v-for="(sub, idx) in analysis.active_subscriptions" 
              :key="idx"
              class="rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-[2px] bg-card"
              :class="{
                  'border-destructive/50 bg-destructive/5': sub.status === 'inactive',
                  'border-warning/50 bg-warning/5': sub.status === 'redundant'
              }"
            >
                <div class="flex items-start gap-4">
                     <!-- Icon placeholder -->
                    <div class="w-12 h-12 rounded-xl bg-background border flex items-center justify-center text-xl font-bold uppercase shadow-sm shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:border-primary/35">
                        {{ sub.name.substring(0, 2) }}
                    </div>
                    
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="text-body font-bold">{{ sub.name }}</h4>
                            <Badge v-if="sub.status === 'inactive'" variant="destructive" class="h-5">Inativo há {{ sub.days_inactive }} dias</Badge>
                            <Badge v-else-if="sub.status === 'redundant'" class="bg-warning text-warning-foreground hover:bg-warning/90 h-5">Redundante</Badge>
                            <Badge v-else variant="secondary" class="h-5 text-muted-foreground">Ativo</Badge>
                        </div>
                        <p class="text-small text-muted-foreground">Último uso: {{ sub.last_usage ? new Date(sub.last_usage).toLocaleDateString() : 'Desconhecido' }}</p>
                        
                        <div v-if="sub.alert" class="flex items-center gap-2 text-small font-medium mt-1" :class="sub.status === 'inactive' ? 'text-destructive' : 'text-warning-foreground'">
                            <AlertCircle class="w-3 h-3" />
                            {{ sub.alert }}
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                    <div class="text-right">
                        <p class="text-h4">{{ formatCurrency(sub.amount) }}</p>
                        <p class="text-micro text-muted-foreground">/mês</p>
                    </div>
                    
                    <button 
                        v-if="sub.recommendation"
                        class="px-4 py-2 rounded-lg bg-background border shadow-sm hover:bg-muted transition-all duration-200 text-small font-medium whitespace-nowrap hover:-translate-y-[1px] hover:shadow-elevation-1 active:scale-[0.98]"
                        :class="sub.status === 'inactive' ? 'text-destructive border-destructive/20 hover:border-destructive/50' : ''"
                    >
                        {{ sub.recommendation }}
                    </button>
                     <button 
                        v-else
                        class="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-small font-medium transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
                    >
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

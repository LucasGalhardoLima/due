<script setup lang="ts">
import { AlertTriangle, Info, CheckCircle, Plus, AlertOctagon } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface AuditItem {
  date: string
  merchant: string
  amount: number
  alert_level: 'info' | 'warning' | 'critical'
  message: string
  reason?: string
  count?: number
}

interface FaturaAudit {
  status: 'divergent' | 'match'
  missing_in_app: AuditItem[]
  missing_in_bank: AuditItem[]
  duplicates: AuditItem[]
  suspicious: AuditItem[]
  total_divergence: number
  action_needed: boolean
}

defineProps<{
  audit: FaturaAudit
}>()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const formatDate = (dateStr: string) => {
   return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Summary Card -->
    <div class="rounded-2xl border p-6 bg-card shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div 
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="audit.status === 'match' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'"
        >
          <CheckCircle v-if="audit.status === 'match'" class="w-6 h-6" />
          <AlertOctagon v-else class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-h4">{{ audit.status === 'match' ? 'Fatura Validada' : 'Divergências Encontradas' }}</h3>
          <p v-if="audit.status === 'match'" class="text-small text-muted-foreground">Tudo certo! Seus lançamentos batem com o banco.</p>
          <p v-else class="text-small text-muted-foreground">
            Diferença total de <span class="font-bold text-destructive">{{ formatCurrency(audit.total_divergence) }}</span> precisa de atenção.
          </p>
        </div>
      </div>
    </div>

    <!-- Critical Issues: Duplicates & Suspicious -->
    <div v-if="audit.duplicates.length > 0 || audit.suspicious.length > 0" class="space-y-4">
      <h4 class="text-small font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
        <AlertOctagon class="w-4 h-4" />
        Atenção Crítica
      </h4>
      
      <!-- Duplicates -->
      <div v-for="(item, idx) in audit.duplicates" :key="'dup'+idx" class="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start justify-between">
        <div class="flex gap-4">
           <div class="bg-destructive/10 p-2 rounded-lg h-fit">
             <AlertTriangle class="w-5 h-5 text-destructive" />
           </div>
           <div>
             <div class="flex items-center gap-2">
               <span class="font-bold text-body">{{ item.merchant }}</span>
               <Badge variant="destructive" class="text-[10px] h-5">Duplicata ({{ item.count }}x)</Badge>
             </div>
             <p class="text-small text-muted-foreground">{{ item.message }}</p>
             <p class="text-micro text-muted-foreground mt-1">{{ formatDate(item.date) }} • {{ formatCurrency(item.amount) }}</p>
           </div>
        </div>
         <button class="text-small font-medium text-destructive hover:underline">Contestar</button>
      </div>

      <!-- Suspicious -->
      <div v-for="(item, idx) in audit.suspicious" :key="'susp'+idx" class="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start justify-between">
        <div class="flex gap-4">
           <div class="bg-destructive/10 p-2 rounded-lg h-fit">
             <AlertTriangle class="w-5 h-5 text-destructive" />
           </div>
           <div>
             <div class="flex items-center gap-2">
               <span class="font-bold text-body">{{ item.merchant }}</span>
               <Badge variant="destructive" class="text-[10px] h-5">Fraude?</Badge>
             </div>
             <p class="text-small text-muted-foreground">{{ item.message }} - {{ item.reason }}</p>
             <p class="text-micro text-muted-foreground mt-1">{{ formatDate(item.date) }} • {{ formatCurrency(item.amount) }}</p>
           </div>
        </div>
         <button class="text-small font-medium text-destructive hover:underline">Não fui eu</button>
      </div>
    </div>

    <!-- Missing in App (Warning) -->
    <div v-if="audit.missing_in_app.length > 0" class="space-y-4">
       <h4 class="text-small font-bold text-warning-foreground uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 text-warning" />
        Faltou lançar
      </h4>
      
      <div v-for="(item, idx) in audit.missing_in_app" :key="'missingapp'+idx" class="rounded-xl border bg-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
         <div class="flex gap-4 items-center">
            <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold">
               ?
            </div>
            <div>
               <p class="text-body font-medium">{{ item.merchant }}</p>
               <p class="text-small text-muted-foreground">{{ formatDate(item.date) }} • {{ formatCurrency(item.amount) }}</p>
            </div>
         </div>
         <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary-accent hover:bg-primary/20 transition-colors text-small font-medium">
            <Plus class="w-4 h-4" />
            Adicionar
         </button>
      </div>
    </div>

    <!-- Missing in Bank (Info) -->
    <div v-if="audit.missing_in_bank.length > 0" class="space-y-4">
       <h4 class="text-small font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Info class="w-4 h-4" />
        Não caiu na fatura
      </h4>
      
      <div v-for="(item, idx) in audit.missing_in_bank" :key="'missingbank'+idx" class="rounded-xl border border-dashed bg-muted/20 p-4 flex items-center justify-between opacity-75">
         <div class="flex gap-4 items-center">
            <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
               <Info class="w-4 h-4" />
            </div>
            <div>
               <p class="text-body font-medium">{{ item.merchant }}</p>
               <p class="text-small text-muted-foreground">{{ formatDate(item.date) }} • {{ formatCurrency(item.amount) }}</p>
            </div>
         </div>
         <span class="text-micro text-muted-foreground bg-muted px-2 py-1 rounded">Aguardando</span>
      </div>
    </div>

  </div>
</template>

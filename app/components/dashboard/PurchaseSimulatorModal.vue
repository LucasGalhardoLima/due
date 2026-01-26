<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import { Sparkles, TrendingUp, TrendingDown, Info, ShoppingCart, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Card } from '@/components/ui/card'

const props = defineProps<{
  open: boolean
  cardId: string
  cardName: string
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

interface SimulationResult {
  viable: boolean
  impact_score: number // 0-10
  recommendation: string
  details: {
    monthly_impact: number
    limit_usage_after: number
    best_purchase_date?: string
  }
}

const amount = ref(0)
const installments = ref([1])
const isLoading = ref(false)
const result = ref<SimulationResult | null>(null)

function setInstallments(n: number) {
    installments.value = [n]
}

async function simulatePurchase() {
    if (amount.value <= 0) {
        toast.error('Informe um valor válido')
        return
    }

    isLoading.value = true
    result.value = null

    try {
        const response = await $fetch<SimulationResult>('/api/ai/simulate-purchase', {
            method: 'POST',
            body: {
                cardId: props.cardId,
                amount: amount.value,
                installments: installments.value[0]
            }
        })
        result.value = response
    } catch (e) {
        toast.error('Erro ao simular compra')
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md bg-background border-border">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
            <div class="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-glass ring-1 ring-primary/30">
              <Sparkles class="w-5 h-5" />
            </div>
            <div>
                <DialogTitle class="text-h3">Simular Compra</DialogTitle>
                <DialogDescription>
                    Verifique o impacto no cartão <span class="font-bold text-foreground">{{ cardName }}</span>
                </DialogDescription>
            </div>
        </div>
      </DialogHeader>

      <div class="space-y-6 py-2">
        <!-- Input Form -->
        <div class="space-y-4" v-if="!result">
             <!-- Amount -->
             <div class="space-y-2">
                <Label>Valor da Compra</Label>
                <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <CurrencyInput 
                        v-model="amount" 
                        class="pl-9 h-12 text-lg font-bold" 
                        placeholder="0,00" 
                        autoFocus
                    />
                </div>
             </div>

             <!-- Installments -->
             <div class="space-y-4 pt-2">
                <div class="flex justify-between items-center">
                    <Label>Parcelas</Label>
                    <span class="font-bold text-lg text-primary">{{ installments[0] }}x</span>
                </div>
                <Slider v-model="installments" :max="12" :min="1" :step="1" />
                <div class="flex justify-between text-xs text-muted-foreground">
                    <button @click="setInstallments(1)" class="hover:text-foreground">1x</button>
                    <button @click="setInstallments(3)" class="hover:text-foreground">3x</button>
                    <button @click="setInstallments(6)" class="hover:text-foreground">6x</button>
                    <button @click="setInstallments(10)" class="hover:text-foreground">10x</button>
                    <button @click="setInstallments(12)" class="hover:text-foreground">12x</button>
                </div>
             </div>

             <Button 
                size="lg" 
                class="w-full font-bold shadow-primary-glow h-12 mt-2" 
                @click="simulatePurchase"
                :disabled="isLoading || amount <= 0"
            >
                <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                {{ isLoading ? 'Simulando...' : 'Verificar Impacto' }}
             </Button>
        </div>

        <!-- Result View -->
        <div v-else class="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <!-- Status Banner -->
             <div 
                class="flex flex-col items-center justify-center p-6 rounded-2xl border text-center gap-3"
                :class="result.viable ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'"
             >
                <div 
                    class="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg mb-1"
                    :class="result.viable ? 'bg-success' : 'bg-destructive'"
                >
                    <CheckCircle2 v-if="result.viable" class="w-6 h-6" />
                    <XCircle v-else class="w-6 h-6" />
                </div>
                <div>
                    <h3 class="text-h3 font-black" :class="result.viable ? 'text-success' : 'text-destructive'">
                        {{ result.viable ? 'Compra Viável' : 'Atenção Necessária' }}
                    </h3>
                    <p class="text-body text-muted-foreground mt-1 px-4 leading-relaxed">
                        {{ result.recommendation }}
                    </p>
                </div>
             </div>

             <!-- Details Grid -->
             <div class="grid grid-cols-2 gap-3">
                 <Card class="p-4 bg-muted/30 border-none shadow-none">
                    <span class="text-micro text-muted-foreground block mb-1">Impacto Mensal</span>
                    <span class="text-body font-black text-foreground block">
                        + {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.details.monthly_impact) }}
                    </span>
                 </Card>
                 <Card class="p-4 bg-muted/30 border-none shadow-none">
                    <span class="text-micro text-muted-foreground block mb-1">Uso do Limite</span>
                    <span class="text-body font-black text-foreground block">
                        {{ result.details.limit_usage_after.toFixed(1) }}%
                    </span>
                 </Card>
             </div>

             <!-- Footer Actions -->
             <div class="flex gap-3 pt-2">
                <Button variant="outline" class="flex-1" @click="result = null">
                    Nova Simulação
                </Button>
                <!-- Maybe 'Add Expense' shortcut later? -->
             </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

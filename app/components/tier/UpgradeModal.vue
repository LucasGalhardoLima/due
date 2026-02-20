<script setup lang="ts">
import { Sparkles, ArrowRight } from 'lucide-vue-next'
import { TIER_LABELS, TIER_LIMITS, type Tier } from '#shared/tier-config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const { isOpen, reason, upgradeTarget, hide } = useUpgradeModal()
const isLoading = ref(false)

const targetTier = computed<Tier>(() => upgradeTarget.value || 'plus')
const targetLabel = computed(() => TIER_LABELS[targetTier.value])
const targetLimits = computed(() => TIER_LIMITS[targetTier.value])

const highlights = computed(() => {
  const t = targetLimits.value
  const items: string[] = []
  if (t.maxCards === null) items.push('Cartoes ilimitados')
  if (t.maxCategories === null) items.push('Categorias ilimitadas')
  if (t.recurring) items.push('Gastos recorrentes')
  if (t.cashFlow) items.push('Fluxo de caixa')
  if (t.tags) items.push('Tags e regras')
  if (t.budgetRollover) items.push('Rollover de orcamento')
  if (t.aiInsightsPerMonth === null) items.push('IA ilimitada')
  else if (t.aiInsightsPerMonth && t.aiInsightsPerMonth > 3) items.push(`${t.aiInsightsPerMonth} insights IA/mes`)
  if (t.proactiveAdvisor) items.push('Advisor proativo')
  if (t.paretoAnalysis) items.push('Analise Pareto')
  return items.slice(0, 6)
})

async function handleUpgrade() {
  isLoading.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/checkout', {
      method: 'POST',
      body: { tier: targetTier.value, interval: 'monthly' },
    })
    if (url) {
      window.location.href = url
    }
  } catch {
    // Fallback: navigate to pricing section
    navigateTo('/#precos')
    hide()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(v: boolean) => !v && hide()">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-primary/10">
            <Sparkles class="w-5 h-5 text-primary" />
          </div>
          <div>
            <DialogTitle class="text-lg">
              Upgrade para {{ targetLabel }}
            </DialogTitle>
            <DialogDescription v-if="reason" class="text-sm mt-0.5">
              {{ reason }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <p class="text-sm text-muted-foreground">
          Desbloqueie recursos avancados para ter controle total das suas financas.
        </p>

        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="item in highlights"
            :key="item"
            class="flex items-center gap-2 text-xs font-medium p-2 rounded-xl bg-primary/5 border border-primary/10"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {{ item }}
          </div>
        </div>
      </div>

      <DialogFooter class="flex flex-col gap-2 sm:flex-col">
        <Button
          class="w-full"
          :disabled="isLoading"
          @click="handleUpgrade"
        >
          <Sparkles class="w-4 h-4 mr-1.5" />
          {{ isLoading ? 'Redirecionando...' : `Assinar ${targetLabel}` }}
          <ArrowRight v-if="!isLoading" class="w-4 h-4 ml-1.5" />
        </Button>
        <NuxtLink
          to="/#precos"
          class="text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
          @click="hide"
        >
          Ver todos os planos
        </NuxtLink>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

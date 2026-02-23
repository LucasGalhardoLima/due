<script setup lang="ts">
import { Crown, Check } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'start'): void
}>()

const isAnnual = ref(false)

const tiers = [
  {
    name: 'Grátis',
    tagline: 'Tudo que você precisa pra começar a se organizar',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Começar Grátis',
    variant: 'outline' as const,
    highlight: false,
    features: [
      'Transações manuais ilimitadas',
      '1 cartão de crédito',
      'Até 10 categorias (emoji + cor)',
      'Controle de parcelas (timeline)',
      'Projeção de faturas (3 meses)',
      'Orçamento mensal (até 5 categorias)',
      '1 importação CSV/mês',
      '3 insights IA/mês',
      'Alertas de crise básicos'
    ]
  },
  {
    name: 'Plus',
    tagline: 'Pra quem quer controle total',
    monthlyPrice: 14.90,
    annualPrice: 139.90,
    cta: 'Assinar Plus',
    variant: 'secondary' as const,
    highlight: true,
    badge: 'Mais Popular',
    features: [
      'Tudo do Grátis +',
      'Cartões ilimitados',
      'Categorias ilimitadas + hierarquia',
      'Regras de auto-categorização',
      'Tags',
      'Projeção de faturas 12 meses',
      'Orçamento completo (ilimitado + rollover)',
      'Até 5 metas de economia',
      'Recorrentes (detecção + análise)',
      'Fluxo de caixa (semanal/mensal)',
      'Importação CSV ilimitada',
      '15 insights IA/mês',
      '10 simulações de compra/mês',
      '1 auditoria de fatura/mês'
    ]
  },
  {
    name: 'Pro',
    tagline: 'Inteligência financeira total com IA',
    monthlyPrice: 29.90,
    annualPrice: 279.90,
    cta: 'Assinar Pro',
    variant: 'default' as const,
    highlight: false,
    features: [
      'Tudo do Plus +',
      'Metas de economia ilimitadas',
      'Fluxo de caixa completo (trimestral/anual)',
      'Insights IA profundos ilimitados',
      'Advisor proativo IA',
      'Simulador de compras ilimitado',
      'Auditoria de fatura ilimitada',
      'Análise de Pareto 80/20',
      'Otimizador de parcelas IA',
      'Auto-parse IA na importação',
      'Prioridade no suporte',
      'Acesso antecipado a novos recursos'
    ]
  }
]

function formatPrice(price: number) {
  if (price === 0) return '0'
  return price.toFixed(2).replace('.', ',')
}

function currentPrice(tier: typeof tiers[number]) {
  if (tier.monthlyPrice === 0) return '0'
  if (isAnnual.value) {
    const monthly = tier.annualPrice / 12
    return formatPrice(monthly)
  }
  return formatPrice(tier.monthlyPrice)
}

function billingLabel(tier: typeof tiers[number]) {
  if (tier.monthlyPrice === 0) return 'pra sempre'
  if (isAnnual.value) return `R$ ${formatPrice(tier.annualPrice)}/ano`
  return '/mês'
}
</script>

<template>
  <section id="precos" class="py-28 relative overflow-hidden">
    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm font-medium mb-6">
          <Crown class="w-4 h-4 text-primary-accent" />
          Planos
        </div>
        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
          Escolha seu plano
        </h2>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece de graça. Evolua quando quiser.
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="flex items-center justify-center gap-4 mb-14">
        <span class="text-sm font-medium" :class="!isAnnual ? 'text-foreground' : 'text-muted-foreground'">Mensal</span>
        <button
          aria-label="Alternar entre mensal e anual"
          class="relative w-14 h-8 rounded-full transition-colors duration-300"
          :class="isAnnual ? 'bg-primary' : 'bg-muted'"
          @click="isAnnual = !isAnnual"
        >
          <div
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300"
            :class="isAnnual ? 'translate-x-7' : 'translate-x-1'"
          />
        </button>
        <span class="text-sm font-medium flex items-center gap-2" :class="isAnnual ? 'text-foreground' : 'text-muted-foreground'">
          Anual
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-muted text-success">
            -22%
          </span>
        </span>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        <div
          v-for="tier in tiers"
          :key="tier.name"
          class="relative rounded-[2rem] p-8 transition-all duration-300"
          :class="[
            tier.highlight
              ? 'border-2 border-primary/40 bg-card shadow-lg shadow-primary/10 md:scale-105 order-first md:order-none'
              : tier.name === 'Pro'
                ? 'border border-border bg-gradient-to-b from-primary/5 to-card'
                : 'border border-border bg-card'
          ]"
        >
          <!-- Popular badge -->
          <div
            v-if="tier.badge"
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            {{ tier.badge }}
          </div>

          <!-- Tier name -->
          <h3 class="text-xl font-bold mb-1">{{ tier.name }}</h3>
          <p class="text-sm text-muted-foreground mb-6">{{ tier.tagline }}</p>

          <!-- Price -->
          <div class="mb-6">
            <div class="flex items-baseline gap-1">
              <span class="text-sm text-muted-foreground">R$</span>
              <span class="text-5xl font-black tracking-tight transition-all duration-300">
                {{ currentPrice(tier) }}
              </span>
              <span v-if="tier.monthlyPrice > 0" class="text-sm text-muted-foreground">/mês</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ billingLabel(tier) }}
            </p>
          </div>

          <!-- CTA -->
          <button
            class="w-full h-12 rounded-2xl font-bold text-sm transition-all duration-300 mb-8"
            :class="[
              tier.highlight
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]'
                : tier.name === 'Pro'
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'border-2 border-border hover:border-primary/40 hover:bg-primary/5'
            ]"
            @click="emit('start')"
          >
            {{ tier.cta }}
          </button>

          <!-- Features -->
          <ul class="space-y-3">
            <li
              v-for="feature in tier.features"
              :key="feature"
              class="flex items-start gap-3 text-sm"
            >
              <Check class="w-4 h-4 mt-0.5 shrink-0 text-ai-accent" />
              <span class="text-muted-foreground">{{ feature }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

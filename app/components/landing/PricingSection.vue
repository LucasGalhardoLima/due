<script setup lang="ts">
const emit = defineEmits<{
  (e: 'start'): void
}>()

const isAnnual = ref(false)

const tiers = [
  {
    name: 'Gratis',
    tagline: 'Tudo que voce precisa pra comecar a se organizar',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Comecar Gratis',
    highlight: false,
    features: [
      'Transacoes manuais ilimitadas',
      '1 cartao de credito',
      'Ate 10 categorias (emoji + cor)',
      'Controle de parcelas (timeline)',
      'Projecao de faturas (3 meses)',
      'Orcamento mensal (ate 5 categorias)',
      '1 importacao CSV/mes',
      '3 insights IA/mes',
      'Alertas de crise basicos',
    ],
  },
  {
    name: 'Plus',
    tagline: 'Pra quem quer controle total',
    monthlyPrice: 14.90,
    annualPrice: 139.90,
    cta: 'Assinar Plus',
    highlight: true,
    badge: 'Mais Popular',
    features: [
      'Tudo do Gratis +',
      'Cartoes ilimitados',
      'Categorias ilimitadas + hierarquia',
      'Regras de auto-categorizacao',
      'Tags',
      'Projecao de faturas 12 meses',
      'Orcamento completo (ilimitado + rollover)',
      'Ate 5 metas de economia',
      'Recorrentes (deteccao + analise)',
      'Fluxo de caixa (semanal/mensal)',
      'Importacao CSV ilimitada',
      '15 insights IA/mes',
      '10 simulacoes de compra/mes',
      '1 auditoria de fatura/mes',
    ],
  },
  {
    name: 'Pro',
    tagline: 'Inteligencia financeira total com IA',
    monthlyPrice: 29.90,
    annualPrice: 279.90,
    cta: 'Assinar Pro',
    highlight: false,
    features: [
      'Tudo do Plus +',
      'Metas de economia ilimitadas',
      'Fluxo de caixa completo (trimestral/anual)',
      'Insights IA profundos ilimitados',
      'Advisor proativo IA',
      'Simulador de compras ilimitado',
      'Auditoria de fatura ilimitada',
      'Analise de Pareto 80/20',
      'Otimizador de parcelas IA',
      'Auto-parse IA na importacao',
      'Prioridade no suporte',
      'Acesso antecipado a novos recursos',
    ],
  },
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
  return '/mes'
}
</script>

<template>
  <section id="pricing-section" class="py-48 px-8 lg:px-20">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-24">
        <span class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-8 block">Planos</span>
        <h2 class="text-4xl lg:text-7xl font-bold uppercase tracking-tighter mb-4">Escolha Seu Plano.</h2>
        <h3 class="text-2xl lg:text-4xl font-light uppercase tracking-widest text-white/20">Comece de graca. Evolua quando quiser.</h3>
      </div>

      <!-- Billing Toggle -->
      <div class="flex items-center justify-center gap-6 mb-20">
        <span
          class="text-[11px] font-bold uppercase tracking-widest transition-colors"
          :class="!isAnnual ? 'text-white' : 'text-white/30'"
        >
          Mensal
        </span>
        <button
          aria-label="Alternar entre mensal e anual"
          class="relative w-16 h-8 rounded-full bg-white/5 border border-white/10 transition-all"
          @click="isAnnual = !isAnnual"
        >
          <div
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300"
            :class="isAnnual ? 'translate-x-[34px]' : 'translate-x-1'"
          />
        </button>
        <span
          class="text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-colors"
          :class="isAnnual ? 'text-white' : 'text-white/30'"
        >
          Anual
          <span class="bg-white/10 text-white/60 px-3 py-1 rounded-full text-[8px] font-bold uppercase">-22%</span>
        </span>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
        <div
          v-for="tier in tiers"
          :key="tier.name"
          class="relative landing-glass rounded-[3rem] p-10 tilt-card transition-all"
          :class="[
            tier.highlight
              ? 'border-white/20 md:scale-105'
              : ''
          ]"
        >
          <!-- Popular badge -->
          <div
            v-if="tier.badge"
            class="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-white text-black text-[9px] font-bold uppercase tracking-widest"
          >
            {{ tier.badge }}
          </div>

          <!-- Tier name -->
          <h3 class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-2">{{ tier.name }}</h3>
          <p class="text-[11px] text-white/40 uppercase leading-relaxed mb-8">{{ tier.tagline }}</p>

          <!-- Price -->
          <div class="mb-8">
            <div class="flex items-baseline gap-1">
              <span class="text-sm text-white/30">R$</span>
              <span class="text-5xl lg:text-6xl font-bold tracking-tighter text-white transition-all duration-300">
                {{ currentPrice(tier) }}
              </span>
              <span v-if="tier.monthlyPrice > 0" class="text-sm text-white/30">/mes</span>
            </div>
            <p class="text-[10px] text-white/20 uppercase mt-2">
              {{ billingLabel(tier) }}
            </p>
          </div>

          <!-- CTA -->
          <button
            class="w-full py-4 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all duration-300 mb-10"
            :class="[
              tier.highlight
                ? 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]'
                : 'landing-glass hover:bg-white/10'
            ]"
            @click="emit('start')"
          >
            {{ tier.cta }}
          </button>

          <!-- Features -->
          <ul class="space-y-4">
            <li
              v-for="feature in tier.features"
              :key="feature"
              class="flex items-start gap-3 text-[11px] uppercase text-white/40"
            >
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

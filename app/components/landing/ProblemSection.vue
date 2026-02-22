<script setup lang="ts">
import { CircleDollarSign, Repeat, Telescope, Frown } from 'lucide-vue-next'

const painPoints = [
  {
    icon: CircleDollarSign,
    title: 'Dinheiro que some',
    description: 'Você ganha, mas não sabe pra onde vai. Fim do mês chega e a conta não fecha.',
    color: 'warning'
  },
  {
    icon: Repeat,
    title: 'Parcelas e assinaturas infinitas',
    description: 'Comprou de 12x e esqueceu. Assinou e não cancelou. A fatura só sobe.',
    color: 'info'
  },
  {
    icon: Telescope,
    title: 'Zero visão do futuro',
    description: 'Quer comprar algo, mas não sabe se vai caber. Planeja uma viagem, mas não faz ideia se vai dar.',
    color: 'danger'
  }
]

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  warning: {
    bg: 'bg-warning-muted',
    icon: 'text-warning',
    border: 'border-warning/20 hover:border-warning/40'
  },
  info: {
    bg: 'bg-info-muted',
    icon: 'text-info',
    border: 'border-info/20 hover:border-info/40'
  },
  danger: {
    bg: 'bg-danger-muted',
    icon: 'text-danger',
    border: 'border-danger/20 hover:border-danger/40'
  }
}
</script>

<template>
  <section class="py-28 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center mb-16">
        <!-- Icon -->
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-warning-muted to-warning/5 border border-warning/20 mb-8 shadow-lg shadow-warning/10">
          <Frown class="w-10 h-10 text-warning" />
        </div>
        
        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight font-display">
          Deixa eu adivinhar...<br class="hidden sm:block" >
          <span class="text-warning">tá difícil, né?</span>
        </h2>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calma, eu entendo. Orçamento que nunca fecha, parcelas que não acabam, metas que
          parecem impossíveis. A vida financeira é caótica, mas não precisa ser. Eu tô aqui pra mudar isso.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(point, index) in painPoints"
          :key="point.title"
          class="group relative p-8 rounded-[2rem] bg-card border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          :class="colorClasses[point.color].border"
        >
          <!-- Number indicator -->
          <div class="absolute top-6 right-6 text-5xl font-black text-muted/10">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <!-- Icon -->
          <div 
            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
            :class="colorClasses[point.color].bg"
          >
            <component 
              :is="point.icon" 
              class="w-7 h-7"
              :class="colorClasses[point.color].icon" 
            />
          </div>

          <h3 class="text-xl font-bold mb-3 font-display">{{ point.title }}</h3>
          <p class="text-muted-foreground leading-relaxed">{{ point.description }}</p>
        </div>
      </div>

      <!-- Transition element -->
      <div class="flex justify-center mt-16">
        <div class="flex items-center gap-3 px-6 py-3 rounded-full bg-success-muted border border-success/20">
          <span class="text-2xl">💡</span>
          <span class="text-sm font-medium text-success">Mas relaxa, tem solução!</span>
        </div>
      </div>
    </div>
  </section>
</template>

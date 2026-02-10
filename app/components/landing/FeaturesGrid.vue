<script setup lang="ts">
import {
  LineChart,
  Sparkles,
  Calculator,
  Upload,
  CreditCard,
  Bell,
  Zap
} from 'lucide-vue-next'

const features = [
  {
    icon: LineChart,
    title: 'Projeção de Faturas',
    description: 'Veja o futuro das suas faturas até 12 meses. Prepare-se para os meses mais pesados.',
    colSpan: 'md:col-span-2',
    rowSpan: 'md:row-span-1',
    size: 'large'
  },
  {
    icon: Sparkles,
    title: 'Advisor IA',
    description: 'Receba diagnósticos profundos e sugestões personalizadas para economizar.',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-2',
    isAi: true,
    size: 'tall'
  },
  {
    icon: Calculator,
    title: 'Simulador de Compras',
    description: 'Antes de comprar, simule o impacto nas suas faturas futuras.',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
    isAi: true,
    size: 'normal'
  },
  {
    icon: Upload,
    title: 'Importação Inteligente',
    description: 'CSV do Nubank, Inter, C6 e mais. Arraste e solte, a IA faz o resto.',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
    size: 'normal'
  },
  {
    icon: CreditCard,
    title: 'Multi-Cartão',
    description: 'Gerencie todos os seus cartões em um só lugar com visão consolidada.',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
    size: 'normal'
  },
  {
    icon: Bell,
    title: 'Alertas de Crise',
    description: 'Receba avisos antes de estourar o limite ou quando algo parecer errado.',
    colSpan: 'md:col-span-2',
    rowSpan: 'md:row-span-1',
    size: 'large'
  }
]
</script>

<template>
  <section class="py-28 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px]" />
    </div>

    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm font-medium mb-6">
          <Zap class="w-4 h-4 text-primary" />
          Ferramentas poderosas
        </div>
        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
          Tudo que você precisa
        </h2>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Interface simples. Resultados extraordinários.
        </p>
      </div>

      <!-- Bento Grid -->
      <div class="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
        <div
          v-for="feature in features"
          :key="feature.title"
          :class="[
            feature.colSpan,
            feature.rowSpan,
            'group relative p-8 rounded-3xl border transition-all duration-500',
            feature.size === 'large' ? 'min-h-[200px]' : '',
            feature.size === 'tall' ? 'min-h-[320px] flex flex-col' : '',
            'hover:scale-[1.02] hover:-translate-y-1',
            feature.isAi
              ? 'bg-gradient-to-br from-secondary/15 via-secondary/5 to-transparent border-secondary/20 hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/10'
              : 'bg-card border-border hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/10'
          ]"
        >
          <!-- Glassmorphism overlay on hover -->
          <div
            class="absolute inset-0 rounded-3xl bg-gradient-to-br from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          />

          <!-- Icon -->
          <div>
            <div
              class="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
              :class="feature.isAi
                ? 'bg-gradient-to-br from-secondary/20 to-secondary/5'
                : 'bg-gradient-to-br from-primary/15 to-primary/5'"
            >
              <component
                :is="feature.icon"
                class="w-7 h-7 transition-colors duration-300"
                :class="feature.isAi ? 'text-secondary' : 'text-secondary'"
              />
            </div>
          </div>

          <!-- Content -->
          <div :class="feature.size === 'tall' ? 'mt-auto' : ''">
            <h3 class="relative text-xl font-bold mb-3 group-hover:text-secondary transition-colors duration-300">
              {{ feature.title }}
              <span v-if="feature.isAi" class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary/15 text-secondary">
                IA
              </span>
            </h3>
            <p class="relative text-muted-foreground leading-relaxed">
              {{ feature.description }}
            </p>
          </div>

          <!-- Arrow indicator -->
          <div class="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

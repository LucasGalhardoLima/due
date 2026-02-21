<script setup lang="ts">
import { Upload, LayoutDashboard, Sparkles, Wand2 } from 'lucide-vue-next'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Me conta tudo',
    description: 'Importa seu CSV ou adiciona na mão. Eu organizo gastos, cartões, parcelas e assinaturas em segundos.',
    color: 'primary'
  },
  {
    number: '02',
    icon: LayoutDashboard,
    title: 'Eu organizo tudo pra você',
    description: 'Orçamento por categoria, metas de economia, projeção de faturas, fluxo de caixa. Tudo num lugar só.',
    color: 'secondary'
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'E te digo o que fazer',
    description: 'Minha IA analisa seus padrões, simula decisões e te dá dicas sob medida. Você decide, eu calculo.',
    color: 'ai-accent'
  }
]

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: {
    bg: 'bg-brand-accent/20',
    text: 'text-primary-accent',
    border: 'border-primary/40'
  },
  secondary: {
    bg: 'bg-primary/10',
    text: 'text-primary-accent',
    border: 'border-primary/30'
  },
  'ai-accent': {
    bg: 'bg-ai-accent/10',
    text: 'text-ai-accent',
    border: 'border-ai-accent/30'
  }
}
</script>

<template>
  <section class="py-28 relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
    </div>

    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-muted border border-success/20 text-sm font-medium mb-6">
          <Wand2 class="w-4 h-4 text-success" />
          Simples assim
        </div>
        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
          Como eu vou te ajudar
        </h2>
        <p class="text-xl text-muted-foreground">
          Três passos e você vai ter o controle que nunca teve.
        </p>
      </div>

      <!-- Timeline -->
      <div class="max-w-3xl mx-auto">
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-accent via-primary to-ai-accent/50 opacity-20" />

          <div class="space-y-6">
            <div
              v-for="step in steps"
              :key="step.number"
              class="relative group"
            >
              <div class="flex gap-6 items-start">
                <!-- Icon with dot -->
                <div class="relative shrink-0">
                  <div
                    class="w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 bg-card z-10 relative"
                    :class="[
                      colorMap[step.color]?.bg || 'bg-primary/10',
                      colorMap[step.color]?.border || 'border-primary/30'
                    ]"
                  >
                    <component
                      :is="step.icon"
                      class="w-7 h-7"
                      :class="colorMap[step.color]?.text || 'text-primary'"
                    />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 pt-2 pb-6">
                  <div class="flex items-center gap-3 mb-2">
                    <span 
                      class="text-xs font-bold px-2 py-1 rounded-xl"
                      :class="[
                        colorMap[step.color]?.bg || 'bg-primary/10',
                        colorMap[step.color]?.text || 'text-primary'
                      ]"
                    >
                      {{ step.number }}
                    </span>
                    <h3 class="text-2xl font-bold group-hover:text-primary-accent transition-colors">
                      {{ step.title }}
                    </h3>
                  </div>
                  <p class="text-muted-foreground leading-relaxed text-lg">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

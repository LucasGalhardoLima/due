<script setup lang="ts">
import { Star, Users, TrendingUp, Award } from 'lucide-vue-next'

const stats = [
  {
    icon: Users,
    value: '2.500+',
    label: 'Usuários ativos',
    color: 'primary'
  },
  {
    icon: TrendingUp,
    value: 'R$ 50M+',
    label: 'Em faturas gerenciadas',
    color: 'info'
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Avaliação média',
    color: 'warning'
  },
  {
    icon: Award,
    value: '98%',
    label: 'Taxa de satisfação',
    color: 'success'
  }
]

const colorClasses: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  info: { bg: 'bg-info-muted', icon: 'text-info' },
  warning: { bg: 'bg-warning-muted', icon: 'text-warning' },
  success: { bg: 'bg-success-muted', icon: 'text-success' }
}
</script>

<template>
  <section class="py-20 bg-muted/30 border-y border-border/70">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="group text-center p-6 rounded-[2rem] bg-card/60 border border-transparent hover:border-border/70 hover:bg-card transition-all duration-300"
        >
          <!-- Icon -->
          <div 
            class="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
            :class="colorClasses[stat.color].bg"
          >
            <component 
              :is="stat.icon" 
              class="w-6 h-6"
              :class="colorClasses[stat.color].icon"
            />
          </div>

          <!-- Value -->
          <div class="text-3xl md:text-4xl font-black tracking-tight mb-1">
            {{ stat.value }}
          </div>

          <!-- Label -->
          <div class="text-sm text-muted-foreground">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <!-- Logo cloud (placeholder for future partnerships) -->
      <div class="mt-16 text-center">
        <p class="text-sm text-muted-foreground mb-6">Compatível com os principais bancos</p>
        <div class="flex flex-wrap items-center justify-center gap-8 opacity-50">
          <div class="text-xl font-bold tracking-tight">Nubank</div>
          <div class="text-xl font-bold tracking-tight">Inter</div>
          <div class="text-xl font-bold tracking-tight">C6 Bank</div>
          <div class="text-xl font-bold tracking-tight">Itaú</div>
          <div class="text-xl font-bold tracking-tight">Bradesco</div>
        </div>
      </div>
    </div>
  </section>
</template>

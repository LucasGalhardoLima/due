<script setup lang="ts">
import { SearchX, Table2, TrendingDown } from 'lucide-vue-next'

const cards = [
  {
    icon: SearchX,
    title: 'Fatura Misteriosa',
    description: 'Nomes que você não reconhece e valores que não batem. O app do banco dificulta o detalhamento e você acaba perdendo o controle do que realmente gastou.'
  },
  {
    icon: Table2,
    title: 'Planilha Manual',
    description: 'Você e seu parceiro gastam horas reconstruindo o controle no Excel ou Google Sheets. Um trabalho braçal, tedioso e que nunca parece estar 100% atualizado.'
  },
  {
    icon: TrendingDown,
    title: 'O Dinheiro Sumiu',
    description: 'Entre parcelas antigas e assinaturas que você esqueceu de cancelar, o saldo evapora sem você perceber. Ter o controle do seu dinheiro significa ter visibilidade do futuro.'
  }
]
</script>

<template>
  <section class="py-32 px-8 lg:px-20">
    <div class="max-w-4xl mx-auto text-center">
      <span class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-8 block">A Realidade</span>
      <h2 class="text-4xl lg:text-7xl font-bold uppercase tracking-tighter mb-12 leading-tight">
        Onde foi parar o dinheiro que sobrou?
      </h2>
      <div class="grid md:grid-cols-3 gap-8 text-left">
        <div
          v-for="card in cards"
          :key="card.title"
          class="landing-glass p-10 rounded-[2rem] tilt-card"
        >
          <component :is="card.icon" class="w-8 h-8 text-white/40 mb-6" />
          <h4 class="text-lg font-bold uppercase mb-4">{{ card.title }}</h4>
          <p class="text-[11px] text-white/40 uppercase leading-relaxed">{{ card.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

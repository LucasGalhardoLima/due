<script setup lang="ts">
const steps = [
  {
    number: '01',
    title: 'Importação Inteligente',
    description: 'Eu decifro descrições enigmáticas do banco e mostro exatamente onde seu dinheiro está indo, organizado por categorias que fazem sentido.'
  },
  {
    number: '02',
    title: 'Adeus Planilha',
    description: 'Tudo o que sua planilha manual faz, mas de forma automática e em tempo real. Saiba exatamente o que já foi pago e o que ainda resta para o mês.'
  },
  {
    number: '03',
    title: 'Projeção Real',
    description: 'Visualize seus compromissos financeiros para os próximos 6 a 12 meses. Tome decisões de compra hoje sabendo como estará seu saldo amanhã.'
  }
]
</script>

<template>
  <section id="solution-section" class="py-48 px-8 lg:px-20 bg-white/[0.02]">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-24">
        <span class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-8 block">A Solução</span>
        <h2 class="text-4xl lg:text-7xl font-bold uppercase tracking-tighter">Do Caos à Automação.</h2>
      </div>
      <div class="grid lg:grid-cols-3 gap-16">
        <div
          v-for="step in steps"
          :key="step.number"
          class="relative"
        >
          <div class="text-8xl font-black opacity-5 absolute -top-12 -left-4">{{ step.number }}</div>
          <h3 class="text-2xl font-bold uppercase mb-6">{{ step.title }}</h3>
          <p class="text-sm text-white/40 uppercase leading-loose">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

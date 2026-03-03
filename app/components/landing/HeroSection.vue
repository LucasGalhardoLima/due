<script setup lang="ts">
import { ArrowRight, PlayCircle, Bot } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'start' | 'demo'): void
}>()
</script>

<template>
  <header class="relative pt-48 pb-32 px-8 lg:px-20 w-full min-h-screen flex flex-col justify-between overflow-hidden">
    <div class="mesh-bg" />

    <div class="w-full flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
      <!-- Text -->
      <div class="flex-1 text-left">
        <div class="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full mb-8">
          <span class="flex h-2 w-2 rounded-full bg-white" />
          <span class="text-[10px] uppercase tracking-widest font-bold opacity-50">Oi, eu sou o Du! 👋</span>
        </div>

        <h1 class="text-5xl lg:text-8xl font-bold mb-10 leading-[1.05] tracking-tighter text-gradient uppercase">
          Cansou de se perder nas faturas e viver de planilha?
        </h1>

        <p class="text-sm lg:text-lg text-white/50 max-w-xl mb-12 leading-relaxed font-medium">
          A fatura chega e você não faz ideia de onde veio tudo aquilo. Chega de brigar com planilhas manuais no Excel ou Google Sheets e apps de banco que escondem a realidade. Eu automatizo tudo para você ter o controle real do seu dinheiro. 💪
        </p>

        <div class="flex flex-col sm:flex-row gap-6 mb-16">
          <button
            class="bg-white text-black px-12 py-6 rounded-full font-bold uppercase text-[11px] flex items-center justify-center gap-4 hover:scale-[1.05] transition-transform shadow-[0_20px_60px_rgba(255,255,255,0.05)]"
            @click="emit('start')"
          >
            Matar minha Planilha <ArrowRight class="w-4 h-4" />
          </button>
          <button
            class="landing-glass px-12 py-6 rounded-full font-bold uppercase text-[11px] flex items-center justify-center gap-4 hover:bg-white/10 transition-all"
            @click="emit('demo')"
          >
            <PlayCircle class="w-4 h-4" /> Ver Demo
          </button>
        </div>
      </div>

      <!-- Dashboard Mockup -->
      <div class="flex-1 relative w-full lg:max-w-3xl">
        <div class="landing-glass p-8 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] rotate-1 relative border-white/10 transition-transform duration-700 hover:rotate-0">
          <div class="flex items-center justify-between mb-8">
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-white/10" />
              <div class="w-3 h-3 rounded-full bg-white/10" />
              <div class="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <span class="text-[10px] opacity-20 font-bold uppercase tracking-[0.3em]">Análise Familiar Ativa</span>
          </div>
          <div class="space-y-6">
            <!-- Fatura row -->
            <div class="h-20 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center px-6 justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <span class="text-[9px] font-black">NU</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold uppercase">Fatura Atual</span>
                  <span class="text-[9px] opacity-30">Previsão de fechamento</span>
                </div>
              </div>
              <span class="text-lg font-bold">R$ 4.450,00</span>
            </div>
            <!-- Stats row -->
            <div class="grid grid-cols-2 gap-4">
              <div class="h-36 bg-white/5 rounded-[2rem] border border-white/10 p-6 flex flex-col justify-between">
                <span class="text-[10px] uppercase opacity-30 tracking-widest">Entradas Totais</span>
                <span class="text-2xl font-bold uppercase tracking-tighter">R$ 8.500</span>
              </div>
              <div class="h-36 bg-white/[0.08] rounded-[2rem] border border-white/10 p-6 flex flex-col justify-between">
                <span class="text-[10px] uppercase text-white/50 tracking-widest">Sobra Livre</span>
                <span class="text-2xl font-bold text-white tracking-tighter uppercase">R$ 1.200</span>
              </div>
            </div>
            <!-- AI Insight -->
            <div class="bg-white text-black p-6 rounded-[2rem] relative overflow-hidden">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <Bot class="w-3 h-3 text-white" />
                </div>
                <span class="text-[10px] font-bold uppercase">Du decifrou sua fatura</span>
              </div>
              <p class="text-xs font-bold leading-relaxed uppercase">
                Identifiquei um aumento em Restaurantes e 3 parcelas que acabam este mês. Quer ver o impacto no seu saldo?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

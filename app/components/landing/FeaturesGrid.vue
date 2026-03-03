<script setup lang="ts">
import { CloudUpload } from 'lucide-vue-next'
</script>

<template>
  <section id="features-section" class="py-48 px-8 lg:px-20">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-24">
        <span class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-8 block">Fim do trabalho manual</span>
        <h2 class="text-4xl lg:text-7xl font-bold uppercase tracking-tighter mb-4">Controle de Nível Executivo.</h2>
        <h3 class="text-2xl lg:text-4xl font-light uppercase tracking-widest text-white/20">Seu tempo vale mais que preencher Excel.</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Projeção de Faturas -->
        <div class="md:col-span-8 landing-glass rounded-[3rem] p-10 flex flex-col lg:flex-row gap-8 hover:bg-white/5 transition-all tilt-card">
          <div class="flex-1">
            <h3 class="text-2xl font-bold uppercase mb-4">Projeção de Faturas</h3>
            <p class="text-[11px] text-white/40 uppercase leading-relaxed mb-6">
              "Descobri que em Março sua fatura terá um pico por causa das parcelas acumuladas". Antecipe-se ao susto.
            </p>
            <div class="flex gap-2">
              <span class="bg-white/10 text-white/60 px-3 py-1 rounded-full text-[8px] font-bold uppercase">Antecipação 12 Meses</span>
            </div>
          </div>
          <div class="flex-1 bg-black/20 rounded-3xl p-6 flex items-end justify-between gap-2 border border-white/5">
            <div class="w-full bg-white/10 rounded-t-xl" style="height: 40%" />
            <div class="w-full bg-white/20 rounded-t-xl" style="height: 60%" />
            <div class="w-full bg-white/60 rounded-t-xl relative" style="height: 90%">
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] px-2 py-1 rounded-md font-bold whitespace-nowrap">MAR: R$ 4.2k</div>
            </div>
          </div>
        </div>

        <!-- Advisor IA -->
        <div class="md:col-span-4 landing-glass rounded-[3rem] p-10 flex flex-col justify-between tilt-card">
          <div>
            <h3 class="text-2xl font-bold uppercase mb-4">Advisor IA</h3>
            <p class="text-[11px] text-white/40 uppercase leading-relaxed">Insights reais: Descubra que sua maior variação de custo veio de assinaturas ou lazer sem você perceber.</p>
          </div>
          <div class="space-y-3 mt-8">
            <div class="bg-white/5 p-4 rounded-2xl rounded-bl-none border border-white/10 text-[9px] uppercase">Por que a fatura subiu?</div>
            <div class="bg-white/20 p-4 rounded-2xl rounded-br-none ml-auto text-[9px] uppercase">Restaurantes (R$850) e a nova parcela da Apple.</div>
          </div>
        </div>

        <!-- Pode parcelar? -->
        <div class="md:col-span-4 landing-glass rounded-[3rem] p-10 flex flex-col justify-between tilt-card">
          <div>
            <h3 class="text-xl font-bold uppercase mb-3">Pode parcelar?</h3>
            <p class="text-[10px] text-white/40 uppercase">Simule o impacto de parcelas no seu fluxo de caixa antes mesmo de passar o cartão.</p>
          </div>
          <div class="bg-black/40 p-6 rounded-3xl border border-white/10 mt-8">
            <div class="flex justify-between text-[11px] mb-2"><span>ITEM:</span> <span>IPHONE</span></div>
            <div class="flex justify-between text-[11px] mb-6"><span>VALOR 12X:</span> <span class="text-white">R$ 790,00</span></div>
            <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-white" style="width: 85%" />
            </div>
          </div>
        </div>

        <!-- Planilha Inteligente -->
        <div class="md:col-span-4 landing-glass rounded-[3rem] p-10 flex flex-col justify-between tilt-card">
          <div>
            <h3 class="text-xl font-bold uppercase mb-3">Planilha Inteligente</h3>
            <p class="text-[10px] text-white/40 uppercase">Sua lógica de controle, mas alimentada sem você digitar uma linha de texto.</p>
          </div>
          <div class="space-y-4 mt-8">
            <div class="flex justify-between text-[8px] uppercase opacity-40"><span>Mercado</span><span>R$ 1.2k</span></div>
            <div class="h-1 bg-white/10 w-full rounded-full"><div class="h-full bg-white/60 w-[90%]" /></div>
            <div class="flex justify-between text-[8px] uppercase opacity-40"><span>Educação</span><span>R$ 1.1k</span></div>
            <div class="h-1 bg-white/10 w-full rounded-full"><div class="h-full bg-white/30 w-[40%]" /></div>
          </div>
        </div>

        <!-- Import CSV -->
        <div class="md:col-span-4 landing-glass rounded-[3rem] p-10 flex flex-col justify-between tilt-card">
          <div>
            <h3 class="text-xl font-bold uppercase mb-3">Import CSV</h3>
            <p class="text-[10px] text-white/40 uppercase">Arraste o arquivo do Nubank ou Itaú. Categorizamos em 10 segundos.</p>
          </div>
          <div class="flex items-center justify-center py-4">
            <div class="w-16 h-16 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
              <CloudUpload class="w-6 h-6 opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

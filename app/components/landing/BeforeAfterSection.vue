<script setup lang="ts">
import { AlertCircle, Table2, CheckCircle2, Utensils, Home } from 'lucide-vue-next'
</script>

<template>
  <section class="py-48 px-8 lg:px-20">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-24">
        <span class="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-8 block">A Transformação</span>
        <h2 class="text-4xl lg:text-7xl font-bold uppercase tracking-tighter">O Fim do Caos Financeiro.</h2>
      </div>
      <div class="grid lg:grid-cols-2 gap-12">
        <!-- SEM O DU -->
        <div class="landing-glass border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
          <div class="absolute top-8 right-10 flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase text-white/30">Sem o Du</span>
            <div class="w-2 h-2 rounded-full bg-white/20" />
          </div>
          <h3 class="text-2xl font-bold uppercase mb-12 opacity-30 italic line-through tracking-tighter">O Caos Manual</h3>

          <div class="space-y-6">
            <div class="p-6 bg-white/5 rounded-2xl border border-white/5 opacity-30 grayscale">
              <div class="flex justify-between items-center mb-4">
                <span class="text-[9px] uppercase font-bold">Extrato Bancário</span>
                <AlertCircle class="w-4 h-4" />
              </div>
              <div class="space-y-4">
                <div class="flex justify-between text-[10px] font-bold"><span>PAG*JOSE-SAOP-192</span> <span>R$ 142,50</span></div>
                <div class="flex justify-between text-[10px] font-bold"><span>MERCPAGO*LUZ-823</span> <span>R$ 2.450,00</span></div>
                <div class="flex justify-between text-[10px] font-bold"><span>IFD*REST-S-392</span> <span>R$ 89,90</span></div>
              </div>
            </div>

            <div class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <Table2 class="w-10 h-10 text-white/5 mb-4" />
              <p class="text-[10px] font-bold uppercase text-white/10">Planilha desatualizada</p>
              <div class="mt-4 px-4 py-2 bg-white/5 rounded-lg">
                <span class="text-[8px] font-bold text-white/30 uppercase tracking-widest">ERRO: #REF!</span>
              </div>
            </div>
          </div>
        </div>

        <!-- COM O DU -->
        <div class="landing-glass border-white/20 p-12 rounded-[3rem] relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div class="absolute top-8 right-10 flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase text-white">Com o Du</span>
            <div class="w-2 h-2 rounded-full bg-white pulse-avatar" />
          </div>
          <h3 class="text-2xl font-bold uppercase mb-12 tracking-tighter">Domínio Absoluto</h3>

          <div class="space-y-6">
            <div class="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-2xl">
              <div class="flex justify-between items-center mb-6">
                <span class="text-[9px] uppercase font-bold text-white/70">Categorização Ativa</span>
                <CheckCircle2 class="w-4 h-4 text-white" />
              </div>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Utensils class="w-4 h-4 text-white/60" />
                    </div>
                    <span class="text-[10px] font-bold uppercase">Almoço Sábado (Restaurante)</span>
                  </div>
                  <span class="text-[10px] font-bold">R$ 142,50</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Home class="w-4 h-4 text-white/60" />
                    </div>
                    <span class="text-[10px] font-bold uppercase">Parcela Sofá (8/12)</span>
                  </div>
                  <span class="text-[10px] font-bold">R$ 2.450,00</span>
                </div>
              </div>
            </div>

            <div class="p-6 bg-black/40 rounded-2xl border border-white/10">
              <div class="flex justify-between text-[9px] font-bold uppercase mb-4"><span>Progresso Orçamentário</span> <span class="text-white">72% Utilizado</span></div>
              <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-white/80" style="width: 72%" />
              </div>
              <div class="mt-6 flex justify-between items-center">
                <span class="text-[9px] font-bold uppercase opacity-30">Projeção Próximo Mês</span>
                <span class="text-sm font-bold tracking-tighter uppercase text-white">R$ 4.280,00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

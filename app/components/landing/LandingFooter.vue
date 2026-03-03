<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="py-32 px-8 lg:px-20 border-t border-white/5">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start gap-20 mb-24">
        <!-- Brand -->
        <div class="space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-white rounded-[22%] flex items-center justify-center">
              <span class="text-black font-black text-sm uppercase">DU</span>
            </div>
          </div>
          <p class="text-xs text-white/30 max-w-xs uppercase leading-loose">
            Soluções automáticas para quem não tem tempo a perder com planilhas manuais.
          </p>
        </div>

        <!-- Link columns -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-16">
          <div class="space-y-6">
            <h5 class="text-[11px] font-bold uppercase tracking-[0.3em] opacity-20">Produto</h5>
            <div class="flex flex-col gap-4 text-[11px] font-bold uppercase text-white/40">
              <a href="#features-section" class="hover:text-white transition-colors">Recursos</a>
              <a href="#" class="hover:text-white transition-colors">Segurança</a>
              <a href="#" class="hover:text-white transition-colors">Preços</a>
            </div>
          </div>
          <div class="space-y-6">
            <h5 class="text-[11px] font-bold uppercase tracking-[0.3em] opacity-20">Legal</h5>
            <div class="flex flex-col gap-4 text-[11px] font-bold uppercase text-white/40">
              <a href="#" class="hover:text-white transition-colors">Privacidade</a>
              <a href="#" class="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
          <div class="space-y-6">
            <h5 class="text-[11px] font-bold uppercase tracking-[0.3em] opacity-20">Social</h5>
            <div class="flex flex-col gap-4 text-[11px] font-bold uppercase text-white/40">
              <a href="#" class="hover:text-white transition-colors">Instagram</a>
              <a href="#" class="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-10">
          © {{ currentYear }} Du Finance S.A. Controle Real.
        </p>
        <div class="flex items-center gap-2 opacity-10">
          <div class="w-2 h-2 rounded-full bg-white" />
          <span class="text-[9px] font-bold uppercase">Sistemas Auditados</span>
        </div>
      </div>
    </div>
  </footer>
</template>

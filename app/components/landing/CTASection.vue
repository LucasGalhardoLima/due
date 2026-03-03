<script setup lang="ts">
const emit = defineEmits<{
  (e: 'start'): void
}>()
</script>

<template>
  <section class="py-64 px-8 lg:px-20">
    <div class="w-full bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#222222] rounded-[4rem] p-20 text-center relative overflow-hidden border border-white/10">
      <div class="mesh-bg opacity-20" />
      <div class="relative z-10">
        <h2 class="text-5xl lg:text-8xl font-bold uppercase tracking-tighter text-white mb-10">
          Cansado de brigar com a própria fatura?
        </h2>
        <p class="text-sm lg:text-xl text-white/50 font-bold uppercase mb-16 max-w-3xl mx-auto">
          Abandone o caos das planilhas manuais e deixe o Du organizar sua vida financeira de forma automática.
        </p>
        <button
          class="inline-flex bg-white text-black px-20 py-8 rounded-full font-bold uppercase text-sm lg:text-base hover:scale-110 transition-transform shadow-2xl"
          @click="emit('start')"
        >
          Automatizar minhas Finanças
        </button>
      </div>
    </div>
  </section>
</template>

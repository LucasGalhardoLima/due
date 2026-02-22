<script setup lang="ts">
import { ArrowRight, Heart } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'start'): void
}>()
</script>

<template>
  <section class="py-28 relative overflow-hidden">
    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Du Avatar -->
        <div class="flex justify-center mb-8">
          <div class="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-primary-foreground font-black text-3xl shadow-2xl shadow-primary/30">
            Du
          </div>
        </div>

        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight font-display">
          E aí, bora resolver<br class="hidden sm:block" >
          <span class="text-primary">isso juntos?</span>
        </h2>
        
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Eu tô aqui pra te ajudar, de verdade. Sem truque, sem pegadinha.
          <span class="text-foreground font-medium">Comece de graça, sem compromisso.</span>
          Quando precisar de mais, eu tô aqui. 🚀
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/sign-up"
            class="group w-full sm:w-auto inline-flex items-center justify-center gap-3 h-16 px-12 rounded-[2rem] bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
            @click="emit('start')"
          >
            <Heart class="w-5 h-5" />
            Começar de graça
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
          <a
            href="#precos"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-16 px-10 rounded-[2rem] border-2 border-border bg-card font-semibold hover:bg-card hover:border-primary/40 transition-all duration-300"
          >
            Ver planos
          </a>
        </div>

        <!-- Guarantee -->
        <div class="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Dados criptografados</span>
          </div>
          <div class="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/50" />
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Sem compromisso</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

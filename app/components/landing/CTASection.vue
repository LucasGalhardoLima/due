<script setup lang="ts">
import { ArrowRight, Heart } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'start'): void
}>()
</script>

<template>
  <section class="py-28 relative overflow-hidden">
    <!-- Gradient background -->
    <div class="absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-primary/10 to-transparent opacity-50" />
    </div>

    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Du Avatar -->
        <div class="flex justify-center mb-8">
          <div class="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/90 rounded-[2rem] flex items-center justify-center text-secondary-foreground font-black text-3xl shadow-2xl shadow-secondary/30">
            Du
          </div>
        </div>

        <h2 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
          E aí, bora resolver<br class="hidden sm:block" >
          <span class="bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">isso juntos?</span>
        </h2>
        
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Eu tô aqui pra te ajudar, de verdade. Sem truque, sem pegadinha. 
          <span class="text-foreground font-medium">É de graça e sempre vai ser.</span>
          Vem comigo! 🚀
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/sign-up"
            class="group w-full sm:w-auto inline-flex items-center justify-center gap-3 h-16 px-12 rounded-[2rem] bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground font-bold text-lg shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 hover:scale-[1.02] transition-all duration-300"
            @click="emit('start')"
          >
            <Heart class="w-5 h-5" />
            Quero conhecer o Du!
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
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

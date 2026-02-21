<script setup lang="ts">
import { ArrowRight, Play, Sparkles, MessageCircle } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'start' | 'demo'): void
}>()
</script>

<template>
  <section class="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
    <div class="container mx-auto px-6 py-24 text-center relative z-10">
      <div class="max-w-4xl mx-auto space-y-10">
        <!-- Du Avatar/Introduction -->
        <div class="flex flex-col items-center gap-4 mb-4">
          <div class="relative">
            <div class="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-primary-foreground font-black text-4xl shadow-2xl shadow-primary/25 rotate-3 hover:rotate-0 transition-transform duration-300">
              Du
            </div>
            <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-ai-accent rounded-full flex items-center justify-center border-4 border-background">
              <MessageCircle class="w-4 h-4 text-ai-accent-foreground" />
            </div>
          </div>
        </div>

        <!-- Personal greeting -->
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted border border-border">
          <Sparkles class="w-4 h-4 text-ai-accent animate-pulse" />
          <span class="text-sm font-bold text-primary-accent">Seu assistente financeiro pessoal</span>
        </div>

        <!-- Personal Headline -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
          <span class="block text-2xl sm:text-3xl text-muted-foreground font-medium mb-4">Oi, eu sou o Du! 👋</span>
          <span class="block mb-2">Vou te ajudar a dominar</span>
          <span class="relative inline-block">
            <span class="text-primary">sua vida financeira.</span>
            <!-- Underline decoration -->
            <svg class="absolute -bottom-2 left-0 w-full h-3 text-brand-accent/30" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path d="M0,5 Q50,0 100,5 T200,5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
          </span>
        </h1>

        <!-- Personal Subheadline -->
        <p class="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Eu organizo seus gastos, controlo suas parcelas, projeto seu orçamento e te mostro
          <span class="text-foreground font-semibold">exatamente o que fazer</span> pra
          você respirar financeiramente. Sem julgamento, só solução. 💪
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <NuxtLink
            to="/sign-up"
            class="group w-full sm:w-auto inline-flex items-center justify-center gap-3 h-16 px-10 rounded-[2rem] bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
            @click="emit('start')"
          >
            Bora resolver isso juntos!
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
          <button
            class="group w-full sm:w-auto inline-flex items-center justify-center gap-3 h-16 px-10 rounded-[2rem] border-2 border-border bg-card font-semibold hover:bg-card hover:border-primary/40 transition-all duration-300"
            @click="emit('demo')"
          >
            <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Play class="w-4 h-4 text-muted-foreground group-hover:text-primary-accent transition-colors" />
            </div>
            Ver como funciona
          </button>
        </div>

        <!-- Trust indicators -->
        <div class="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-ai-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Comece de graça</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-ai-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Pronto em 2 minutos</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-ai-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Seus dados são só seus</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
      <span class="text-xs font-medium">Deixa eu te mostrar</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>
  </section>
</template>

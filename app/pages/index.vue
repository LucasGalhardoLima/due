<script setup lang="ts">
import { Sparkles, Upload, CheckCircle, ArrowRight } from 'lucide-vue-next'
const { userId } = useAuth()

definePageMeta({
  layout: false // Landing page doesn't need the internal header
})
</script>

<template>
  <div class="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
    <!-- Hero Section -->
    <section class="relative pt-20 pb-32 md:pt-32 md:pb-48">
      <!-- Background Decorations -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10 blur-3xl" />
      <div class="absolute top-20 right-[10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div class="absolute top-40 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style="animation-delay: 2s" />

      <div class="container mx-auto px-4 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase border border-primary/20">
          <Sparkles class="w-3 h-3" />
          Financeiro Inteligente
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Domine suas finanças com <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">clareza total</span>
        </h1>
        
        <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          O Due é o gerenciador financeiro que não te faz perder tempo. 
          Importação inteligente, insights em tempo real e controle absoluto do seu orçamento.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <NuxtLink 
            v-if="userId"
            to="/dashboard" 
            class="h-12 px-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto"
          >
            Ir para o Dashboard
          </NuxtLink>
          <NuxtLink 
            v-else
            to="/sign-up" 
            class="h-12 px-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto"
          >
            Começar Agora Grátis
          </NuxtLink>
          <NuxtLink 
            to="/features"
            class="h-12 px-8 inline-flex items-center justify-center rounded-full border border-border bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-all w-full sm:w-auto"
          >
            Ver Todas as Features
          </NuxtLink>
        </div>

        <!-- Dashboard Preview -->
        <div class="mt-20 relative px-4 max-w-5xl mx-auto">
          <div class="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl -z-10 translate-y-8" />
          <div class="rounded-2xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-video relative group border-primary/20">
             <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
             <!-- Mock UI elements for the image -->
             <div class="p-8 h-full flex flex-col gap-6 opacity-80 scale-95 group-hover:scale-100 transition-transform duration-700">
                <div class="h-8 w-48 bg-muted rounded-md" />
                <div class="grid grid-cols-3 gap-6">
                    <div class="h-32 bg-primary/10 rounded-xl border border-primary/20 flex flex-col items-center justify-center gap-2">
                        <div class="w-12 h-1 bg-primary/40 rounded-full" />
                        <div class="w-8 h-1 bg-primary/20 rounded-full" />
                    </div>
                    <div class="h-32 bg-muted rounded-xl" />
                    <div class="h-32 bg-muted rounded-xl" />
                </div>
                <div class="flex-grow bg-card/50 rounded-xl border border-border p-6 space-y-4">
                    <div class="flex justify-between items-center"><div class="h-4 w-32 bg-muted rounded" /><div class="h-4 w-16 bg-muted rounded" /></div>
                    <div class="h-2 w-full bg-muted rounded-full overflow-hidden"><div class="h-full w-2/3 bg-primary" /></div>
                    <div class="space-y-3 pt-4">
                        <div v-for="i in 3" :key="i" class="flex justify-between items-center py-2 border-b border-border/50">
                            <div class="flex gap-3 items-center">
                                <div class="w-8 h-8 rounded-lg bg-muted" />
                                <div class="h-4 w-24 bg-muted rounded" />
                            </div>
                            <div class="h-4 w-16 bg-muted rounded" />
                        </div>
                    </div>
                </div>
             </div>
             <!-- Overlay for "Check out our UI" vibe -->
             <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 backdrop-blur-[2px]">
                <div class="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold flex items-center gap-2">
                    Design Moderno <ArrowRight class="w-4 h-4" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-muted/30 relative">
      <div class="container mx-auto px-4">
        <div class="text-center space-y-4 mb-16">
          <h2 class="text-3xl md:text-4xl font-bold">Tudo que você precisa para <span class="text-primary">prosperar</span></h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">Funcionalidades pensadas para quem odeia planilhas complexas, mas ama controle absoluto.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Sparkles class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold mb-3">Insights com IA</h3>
            <p class="text-muted-foreground leading-relaxed">
              Receba diagnósticos precisos sobre seus gastos e planos de ação práticos gerados por inteligência artificial.
            </p>
          </div>

          <div class="p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
              <Upload class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold mb-3">Importação Inteligente</h3>
            <p class="text-muted-foreground leading-relaxed">
              O "Matador de Preguiça". Arraste seu CSV e deixe que nossa IA classifique automaticamente cada transação.
            </p>
          </div>

          <div class="p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
              <CheckCircle class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold mb-3">Isolamento Seguro</h3>
            <p class="text-muted-foreground leading-relaxed">
              Cada conta é um bunker. Seus dados são criptografados e isolados, acessíveis apenas por você via Clerk Auth.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t">
      <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-2 font-bold text-xl">
          <div class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
            D
          </div>
          Due
        </div>
        <div class="text-sm text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} Due Finance. Todos os direitos reservados.
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/features" class="text-sm hover:text-primary transition-colors">Features</NuxtLink>
          <NuxtLink to="/sign-in" class="text-sm hover:text-primary transition-colors">Entrar</NuxtLink>
          <NuxtLink to="/sign-up" class="text-sm border px-4 py-2 rounded-full hover:bg-muted transition-colors">Cadastrar</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>



<style scoped>
.container {
  max-width: 1200px;
}
</style>

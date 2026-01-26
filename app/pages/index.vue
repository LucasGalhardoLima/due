<script setup lang="ts">
import { Sparkles, Upload, CheckCircle, ArrowRight, Check, Clock, Shield, TrendingUp, PieChart, Users, Calendar, Bell, FileText, Smartphone, Building2, DollarSign, MessageSquare, Target, Globe, ChevronDown, Moon, Sun } from 'lucide-vue-next'

const { userId } = useAuth()
const colorMode = useColorMode()

const features = [
  {
    icon: Upload,
    title: 'Importação Inteligente',
    description: 'Arraste seu CSV do Nubank, Inter e outros. Nossa IA organiza e categoriza tudo instantaneamente.',
    colSpan: 'md:col-span-2'
  },
  {
    icon: Sparkles,
    title: 'Simulador de Compra IA',
    description: 'Antes de passar o cartão, pergunte ao Due. Nossa IA analisa seu limite e faturas para dar o sinal verde.',
    colSpan: 'md:col-span-1'
  },
  {
    icon: PieChart,
    title: 'Raio-X das Categorias',
    description: 'Visualize com precisão cirúrgica para onde seu dinheiro está indo com gráficos inteligentes e interativos.',
    colSpan: 'md:col-span-1'
  },
  {
    icon: MessageSquare,
    title: 'AI Advisor',
    description: 'Seu copiloto financeiro. Receba diagnósticos profundos e sugestões de economia baseadas no seu perfil.',
    colSpan: 'md:col-span-1'
  },
  {
    icon: Target,
    title: 'Metas e Orçamentos',
    description: 'Defina limites por cartão e acompanhe sua evolução mensal com metas claras e visuais.',
    colSpan: 'md:col-span-1'
  },
  {
    icon: TrendingUp,
    title: 'Projeção de Faturas',
    description: 'Prepare-se para o futuro. Veja o impacto das suas parcelas nos próximos meses com precisão.',
    colSpan: 'md:col-span-1'
  },
  {
    icon: Shield,
    title: 'Privacidade Total',
    description: 'Seus dados financeiros são sagrados. Banco de dados isolado e autenticação via Clerk.',
    colSpan: 'md:col-span-2'
  }
]

const roadmap = [
  {
    status: 'done',
    icon: Shield,
    title: 'Módulo de Auditoria',
    description: 'Histórico completo e detalhado de todas as transações criadas, com filtros avançados.',
    eta: 'Concluído'
  },
  {
    status: 'done',
    icon: Target,
    title: 'Metas por Cartão',
    description: 'Sistema de budget individual para cada cartão de crédito com alertas visuais.',
    eta: 'Concluído'
  },
  {
    status: 'done',
    icon: Sparkles,
    title: 'Simulador IA v1',
    description: 'Motor de análise preditiva para avaliar a viabilidade de novas compras.',
    eta: 'Concluído'
  },
  {
    status: 'soon',
    icon: Smartphone,
    title: 'App Instalável (PWA)',
    description: 'Instale o Due direto na home do seu celular para uma experiência nativa.',
    eta: 'Q1 2026'
  },
  {
    status: 'planned',
    icon: MessageSquare,
    title: 'Advisor AI 2.0',
    description: 'Chat interativo para tirar dúvidas e analisar histórico de gastos.',
    eta: 'Q4 2026'
  },
  {
    status: 'planned',
    icon: Building2,
    title: 'Open Finance',
    description: 'Conexão direta com bancos para importar transações automaticamente.',
    eta: 'Q4 2026'
  }
]

const faqs = [
  {
    question: 'O Due é gratuito?',
    answer: 'Sim! A versão atual do Due é 100% gratuita. No futuro, podemos introduzir recursos premium opcionais.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Utilizamos Clerk para autenticação enterprise-grade e criptografia de ponta.'
  },
  {
    question: 'Preciso conectar banco?',
    answer: 'Não! Funciona com importação manual de CSV ou lançamentos manuais. Total privacidade.'
  },
  {
    question: 'Como funciona a IA?',
    answer: 'Utilizamos GPT-4o para analisar padrões, sem reter seus dados pessoais.'
  }
]

const authMode = ref<'none' | 'sign-in' | 'sign-up'>('none')

function openSignIn() {
  authMode.value = 'sign-in'
}

function openSignUp() {
  authMode.value = 'sign-up'
}

function closeAuth() {
  authMode.value = 'none'
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans antialiased transition-colors duration-300">
    
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/70 shadow-glass supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-8 h-20 flex items-center justify-between">
        <NuxtLink to="/" class="font-black text-2xl flex items-center gap-3 tracking-tighter group">
          <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-card text-xl font-black shadow-elevation-3 shadow-primary/25 transition-transform group-hover:scale-105">
            D
          </div>
          Due
        </NuxtLink>
        <div class="flex items-center gap-6 md:gap-8">
          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-sm font-medium hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#roadmap" class="text-sm font-medium hover:text-primary transition-colors">Roadmap</a>
          </div>
          <div class="flex items-center gap-4">
             <button 
              @click="toggleTheme" 
              class="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              <Moon v-if="colorMode.value === 'light'" class="w-5 h-5" />
              <Sun v-else class="w-5 h-5" />
            </button>
            <div class="h-6 w-px bg-border/50 hidden md:block"></div>
            <button @click="openSignIn" class="text-sm font-bold hover:text-primary transition-colors" aria-label="Entrar na conta">Entrar</button>
            <button @click="openSignUp" class="hidden md:inline-flex h-9 px-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-elevation-3 shadow-primary/25 hover:scale-105 active:scale-[0.98] transition-all">
              Criar Conta
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <!-- Background Blobs -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] -z-10" aria-hidden="true">
        <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] motion-safe:animate-pulse" />
        <div class="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-primary/10 rounded-full blur-[140px] motion-safe:animate-pulse duration-&lsqb;10s&lsqb;" />
        <div class="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>
      
      <div class="container mx-auto px-8 text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase backdrop-blur-md shadow-sm">
          <span class="w-2 h-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" />
          Finanças Reimaginadas
        </div>
        
        <h1 class="text-6xl md:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[0.9] text-foreground transition-all duration-700">
          Domine sua <span class="text-transparent bg-clip-text bg-gradient-to-br from-primary via-cyan-400 to-emerald-500">fatura,</span> não sua planilha.
        </h1>
        
        <p class="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
          Controle inteligente de cartão de crédito com projeção futura, Advisor IA e importação automática. <span class="text-foreground italic">Poderoso no desktop, perfeito no mobile.</span>
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <NuxtLink 
            v-if="userId"
            to="/dashboard" 
            class="h-14 px-10 inline-flex items-center justify-center rounded-full bg-foreground text-background font-bold text-lg shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
          >
            Acessar Dashboard
          </NuxtLink>
          <NuxtLink 
            v-else
            to="/sign-up" 
            class="h-14 px-10 inline-flex items-center justify-center rounded-full bg-foreground text-background font-bold text-lg shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
          >
            Começar Gratuitamente
          </NuxtLink>
          <a 
            href="#features"
            class="h-14 px-10 inline-flex items-center justify-center rounded-full border border-border/50 bg-background/50 backdrop-blur-md hover:bg-muted/50 transition-all w-full sm:w-auto font-semibold"
          >
            Explorar Features
          </a>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-20 z-20">
        <ChevronDown class="w-5 h-5" />
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section id="features" class="py-16 relative overflow-hidden">
      <!-- Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      
      <div class="container mx-auto px-8">
        <div class="mb-20">
           <h2 class="text-4xl md:text-6xl font-black tracking-tight mb-6">Poder sem <span class="text-primary/80">complexidade.</span></h2>
           <p class="text-xl text-muted-foreground max-w-2xl font-medium">Ferramentas de elite, simplificadas para você.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            :class="[
              feature.colSpan,
              'group relative p-8 rounded-2xl bg-secondary/20 dark:bg-zinc-900/40 border border-border/50 backdrop-blur-xl shadow-elevation-2 hover:shadow-elevation-4 hover:border-primary/50 transition-all duration-500 overflow-hidden'
            ]"
          >
            <!-- Hover Glow -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div class="relative z-10 h-full flex flex-col justify-between space-y-8">
              <div class="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center text-primary shadow-elevation-2 border border-border/50 group-hover:scale-110 transition-transform duration-500">
                <component :is="feature.icon" class="w-7 h-7" />
              </div>

              <div>
                <h3 class="text-h2 mb-3">{{ feature.title }}</h3>
                <p class="text-body text-muted-foreground">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Roadmap Section (Timeline) -->
    <section id="roadmap" class="py-16 relative">
       <!-- timeline bar -->
       <div class="absolute left-1/2 -translate-x-1/2 top-48 bottom-32 w-px bg-gradient-to-b from-primary/40 via-border/40 to-transparent hidden md:block" />
       
       <div class="container mx-auto px-8">
        <div class="mb-20 text-center">
           <h2 class="text-4xl md:text-6xl font-black tracking-tight mb-6">O futuro é brilhante.</h2>
           <p class="text-xl text-muted-foreground mx-auto max-w-2xl">Transparência radical sobre nossos próximos passos.</p>
        </div>

        <div class="space-y-24 relative">
          <div 
            v-for="(item, index) in roadmap" 
            :key="item.title"
            class="flex flex-col md:flex-row items-center gap-8 md:gap-0"
            :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
          >
            <!-- Content -->
            <div class="flex-1 w-full md:w-auto">
               <div
                class="p-8 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-xl shadow-elevation-2 group hover:shadow-elevation-4 hover:border-primary/40 transition-all duration-500"
                :class="index % 2 === 0 ? 'md:mr-16' : 'md:ml-16'"
              >
                  <div class="flex items-center justify-between mb-6">
                    <div class="p-3 rounded-2xl bg-secondary/50 text-foreground/80 shadow-elevation-1 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                      <component :is="item.icon" class="w-6 h-6" />
                    </div>
                    <span
                      class="px-3 py-1 rounded-full text-micro border"
                      :class="[
                        item.status === 'done' ? 'bg-success-muted text-success border-success/20' :
                        item.status === 'soon' ? 'bg-warning-muted text-warning border-warning/20' :
                        'bg-info-muted text-info border-info/20'
                      ]"
                    >
                      {{ item.eta }}
                    </span>
                  </div>
                  <h4 class="text-h2 mb-3">{{ item.title }}</h4>
                  <p class="text-body text-muted-foreground">{{ item.description }}</p>
               </div>
            </div>

            <!-- Timeline Marker -->
            <div class="relative z-10 flex items-center justify-center w-12">
               <div :class="['w-4 h-4 rounded-full bg-background border-4 shadow-lg transition-colors duration-500', item.status === 'done' ? 'border-emerald-500 shadow-emerald-500/30' : 'border-primary shadow-primary/50']" />
            </div>

            <!-- Spacer -->
            <div class="flex-1 hidden md:block" />
          </div>
        </div>
       </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-16 relative overflow-hidden bg-secondary/5 dark:bg-zinc-950/20">
      <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      
      <div class="container mx-auto px-8 max-w-4xl">
        <h2 class="text-3xl md:text-5xl font-black tracking-tight mb-16 text-center">Dúvidas Frequentes</h2>

        <div class="space-y-4">
          <details
            v-for="faq in faqs"
            :key="faq.question"
            class="group p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-xl shadow-elevation-1 open:shadow-elevation-3 open:bg-card/80 open:border-primary/30 transition-all duration-300"
          >
            <summary class="text-h3 cursor-pointer list-none flex items-center justify-between">
              {{ faq.question }}
              <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180 group-open:text-primary" />
            </summary>
            <p class="mt-4 text-body text-muted-foreground animate-in slide-in-from-top-2 fade-in duration-300">
              {{ faq.answer }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-16 border-t border-border/40 relative overflow-hidden">
      <div class="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 rounded-full blur-[80px] -z-10" />
      
      <div class="container mx-auto px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
          <div class="flex items-center gap-2 font-black text-xl tracking-tighter group">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-card text-sm font-black shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              D
            </div>
            Due
          </div>
          <div class="flex items-center gap-6">
            <NuxtLink to="/privacy" class="text-sm font-medium hover:text-primary transition-colors">Privacidade</NuxtLink>
            <p class="text-sm text-muted-foreground font-medium">
              &copy; {{ new Date().getFullYear() }} Due Finance.
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Auth Modals -->
    <Transition 
      enter-active-class="transition duration-300 ease-out" 
      enter-from-class="opacity-0 scale-95" 
      enter-to-class="opacity-100 scale-100" 
      leave-active-class="transition duration-200 ease-in" 
      leave-from-class="opacity-100 scale-100" 
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="authMode !== 'none'" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm overscroll-contain" @click="closeAuth" />
        
        <div class="relative w-full max-w-md bg-card border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <button
            @click="closeAuth"
            class="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10"
            aria-label="Fechar modal"
          >
            <ChevronDown class="w-5 h-5 rotate-90 md:rotate-0" />
          </button>

          <div class="flex items-center justify-center p-8 pt-16">
            <SignIn 
              v-if="authMode === 'sign-in'" 
              after-sign-in-url="/dashboard" 
              sign-up-url="#"
              @click.capture="(e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.innerText?.includes('Sign up')) {
                  e.stopPropagation();
                  e.preventDefault();
                  openSignUp();
                }
              }"
            />
            <SignUp 
              v-if="authMode === 'sign-up'" 
              after-sign-up-url="/dashboard" 
              sign-in-url="#"
              @click.capture="(e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.innerText?.includes('Sign in')) {
                  e.stopPropagation();
                  e.preventDefault();
                  openSignIn();
                }
              }"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
}

html {
  scroll-behavior: smooth;
}

details summary::-webkit-details-marker {
  display: none;
}
</style>

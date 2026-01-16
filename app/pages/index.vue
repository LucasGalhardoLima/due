<script setup lang="ts">
import { Sparkles, Upload, CheckCircle, ArrowRight, Check, Clock, Shield, TrendingUp, PieChart, Users, Calendar, Bell, FileText, Smartphone, Building2, DollarSign, Share2, Globe, ChevronDown } from 'lucide-vue-next'

const { userId } = useAuth()

const features = [
  {
    icon: Shield,
    title: 'Autenticação Multi-Usuário',
    description: 'Sistema de login seguro com Clerk. Cada conta é isolada e protegida com criptografia de ponta.',
  },
  {
    icon: Sparkles,
    title: 'Insights com IA (GPT-4o)',
    description: 'Receba diagnósticos precisos sobre seus gastos e ações práticas para reduzir despesas.',
  },
  {
    icon: Upload,
    title: 'Importação Inteligente de CSV',
    description: 'O "Matador de Preguiça". Arraste seu extrato e a IA classifica automaticamente cada transação.',
  },
  {
    icon: TrendingUp,
    title: 'Metas de Gastos Personalizadas',
    description: 'Defina metas para cada cartão e visualize seu progresso em tempo real com alertas coloridos.',
  },
  {
    icon: PieChart,
    title: 'Análise de Pareto',
    description: 'Identifique instantaneamente onde 80% do seu dinheiro está indo com gráficos intuitivos.',
  },
  {
    icon: Users,
    title: 'Gerenciamento de Categorias',
    description: 'Crie, edite e organize categorias com autocomplete inteligente. Sem limites, sem fricção.',
  },
  {
    icon: Calendar,
    title: 'Assinaturas Recorrentes',
    description: 'Automatize lançamentos mensais de serviços recorrentes como Netflix, academia e etc.',
  },
  {
    icon: FileText,
    title: 'Painel de Auditoria',
    description: 'Visualize o histórico completo de lançamentos para identificar erros e inconsistências.',
  }
]

const roadmap = [
  {
    status: 'soon',
    icon: Smartphone,
    title: 'Aplicativo Mobile',
    description: 'Apps nativos para iOS e Android com notificações push e sincronização em tempo real.',
    eta: 'Q2 2026'
  },
  {
    status: 'soon',
    icon: Building2,
    title: 'Integração Bancária',
    description: 'Conecte suas contas via Open Banking e sincronize transações automaticamente, sem CSV.',
    eta: 'Q2 2026'
  },
  {
    status: 'planned',
    icon: DollarSign,
    title: 'Controle de Investimentos',
    description: 'Acompanhe ações, fundos e criptomoedas em um só lugar com consolidação de patrimônio.',
    eta: 'Q3 2026'
  },
  {
    status: 'planned',
    icon: Share2,
    title: 'Compartilhamento Familiar',
    description: 'Compartilhe dashboards com família mantendo privacidade de dados sensíveis.',
    eta: 'Q3 2026'
  },
  {
    status: 'planned',
    icon: Bell,
    title: 'Alertas Inteligentes',
    description: 'Notificações via WhatsApp/Email quando atingir 70%, 90% ou 100% da meta.',
    eta: 'Q4 2026'
  },
  {
    status: 'planned',
    icon: Globe,
    title: 'Multi-Moeda',
    description: 'Gerencie gastos em dólar, euro e outras moedas com conversão automática.',
    eta: 'Q4 2026'
  }
]

const faqs = [
  {
    question: 'O Due é gratuito?',
    answer: 'Sim! A versão atual do Due é 100% gratuita. No futuro, podemos introduzir recursos premium opcionais, mas o core sempre será gratuito.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Utilizamos Clerk para autenticação enterprise-grade e todos os dados são isolados por usuário com criptografia. Nunca compartilhamos suas informações financeiras.'
  },
  {
    question: 'Preciso conectar minha conta bancária?',
    answer: 'Não! O Due funciona com importação manual de CSV ou entrada manual de transações. No futuro, ofereceremos integração via Open Banking como opção.'
  },
  {
    question: 'Como funciona a IA?',
    answer: 'Utilizamos GPT-4o da OpenAI para analisar seus padrões de gastos e fornecer insights personalizados. A IA nunca armazena seus dados - apenas processa temporariamente para análise.'
  },
  {
    question: 'Posso usar em múltiplos dispositivos?',
    answer: 'Sim! Seus dados são sincronizados na nuvem. Acesse de qualquer navegador fazendo login com sua conta. Apps mobile estão no roadmap.'
  },
  {
    question: 'Vocês suportam parcelamento?',
    answer: 'Sim! O Due calcula automaticamente parcelas de compras e gera um plano de pagamento completo com vencimentos por fatura.'
  }
]

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden scroll-smooth">
    <!-- Hero Section -->
    <section id="home" class="relative pt-20 pb-32 md:pt-32 md:pb-48">
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
          <a 
            href="#features"
            class="h-12 px-8 inline-flex items-center justify-center rounded-full border border-border bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-all w-full sm:w-auto"
          >
            Ver Features
          </a>
        </div>

        <!-- Scroll Indicator -->
        <div class="pt-12 animate-bounce">
          <ChevronDown class="w-6 h-6 mx-auto text-muted-foreground" />
        </div>

        <!-- Dashboard Preview -->
        <div class="mt-20 relative px-4 max-w-5xl mx-auto">
          <div class="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl -z-10 translate-y-8" />
          <div class="rounded-2xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-video relative group border-primary/20">
             <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
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
    <section id="features" class="py-24 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="text-center space-y-4 mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
            <Check class="w-3 h-3" />
            Disponível Agora
          </div>
          <h2 class="text-3xl md:text-4xl font-bold">Tudo que você precisa para <span class="text-primary">prosperar</span></h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">Funcionalidades pensadas para quem odeia planilhas complexas, mas ama controle absoluto.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all group hover:shadow-lg"
          >
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <component :is="feature.icon" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-bold mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Roadmap Section -->
    <section id="roadmap" class="py-24">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-4">
            <Clock class="w-3 h-3" />
            Roadmap Público
          </div>
          <h2 class="text-3xl md:text-4xl font-bold mb-4">O que vem por aí</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Transparência total. Veja exatamente o que estamos construindo e quando esperamos lançar.
          </p>
        </div>

        <div class="max-w-4xl mx-auto space-y-4">
          <div 
            v-for="(item, index) in roadmap" 
            :key="item.title"
            class="group relative p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
          >
            <div 
              v-if="index !== roadmap.length - 1"
              class="absolute left-[35px] top-[60px] w-0.5 h-[calc(100%+16px)] bg-gradient-to-b from-primary/50 to-transparent"
            />
            
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div 
                  class="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  :class="item.status === 'soon' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'"
                >
                  <component :is="item.icon" class="w-6 h-6" />
                </div>
              </div>
              
              <div class="flex-grow">
                <div class="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <h3 class="text-xl font-bold">{{ item.title }}</h3>
                  <div class="flex items-center gap-2">
                    <span 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap"
                      :class="item.status === 'soon' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'"
                    >
                      <Clock class="w-2.5 h-2.5" />
                      {{ item.status === 'soon' ? 'Em Breve' : 'Planejado' }}
                    </span>
                    <span class="text-xs text-muted-foreground font-mono">{{ item.eta }}</span>
                  </div>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-24 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Respostas rápidas para as dúvidas mais comuns sobre o Due.
          </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-4">
          <details 
            v-for="faq in faqs" 
            :key="faq.question"
            class="group p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all"
          >
            <summary class="font-bold text-lg cursor-pointer list-none flex items-center justify-between">
              {{ faq.question }}
              <ChevronDown class="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            <p class="mt-4 text-muted-foreground leading-relaxed">
              {{ faq.answer }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24">
      <div class="container mx-auto px-4 text-center">
        <div class="max-w-3xl mx-auto space-y-6">
          <h2 class="text-4xl md:text-5xl font-bold">
            Pronto para tomar <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">controle total</span> das suas finanças?
          </h2>
          <p class="text-lg text-muted-foreground">
            Junte-se a centenas de usuários que já estão transformando a forma como gerenciam seu dinheiro.
          </p>
          <NuxtLink 
            to="/sign-up"
            class="inline-flex items-center gap-2 h-14 px-10 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-primary/30"
          >
            Começar Gratuitamente
            <ArrowRight class="w-5 h-5" />
          </NuxtLink>
          <p class="text-sm text-muted-foreground">Sem cartão de crédito. Sem truques. Apenas finanças sob controle.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t bg-muted/20">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div class="flex items-center gap-2 font-bold text-xl">
            <div class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
              D
            </div>
            Due
          </div>
          <div class="flex items-center gap-6 flex-wrap justify-center">
            <a href="#home" class="text-sm hover:text-primary transition-colors">Home</a>
            <a href="#features" class="text-sm hover:text-primary transition-colors">Features</a>
            <a href="#roadmap" class="text-sm hover:text-primary transition-colors">Roadmap</a>
            <a href="#faq" class="text-sm hover:text-primary transition-colors">FAQ</a>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/sign-in" class="text-sm hover:text-primary transition-colors">Entrar</NuxtLink>
            <NuxtLink to="/sign-up" class="text-sm px-4 py-2 border rounded-full hover:bg-muted transition-colors">Cadastrar</NuxtLink>
          </div>
        </div>
        <div class="text-center text-sm text-muted-foreground border-t pt-8">
          <p>&copy; {{ new Date().getFullYear() }} Due Finance. Todos os direitos reservados.</p>
          <p class="mt-2">Feito com ❤️ para quem leva finanças a sério.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom styling for details/summary */
details summary::-webkit-details-marker {
  display: none;
}
</style>

<script setup lang="ts">
import { Check, Clock, Sparkles, Upload, Shield, TrendingUp, PieChart, Users, Calendar, Bell, FileText, Smartphone, Building2, DollarSign, Share2, Globe } from 'lucide-vue-next'

const features = [
  {
    status: 'live',
    icon: Shield,
    title: 'Autenticação Multi-Usuário',
    description: 'Sistema de login seguro com Clerk. Cada conta é isolada e protegida com criptografia de ponta.',
    color: 'emerald'
  },
  {
    status: 'live',
    icon: Sparkles,
    title: 'Insights com IA (GPT-4o)',
    description: 'Receba diagnósticos precisos sobre seus gastos e ações práticas para reduzir despesas.',
    color: 'indigo'
  },
  {
    status: 'live',
    icon: Upload,
    title: 'Importação Inteligente de CSV',
    description: 'O "Matador de Preguiça". Arraste seu extrato e a IA classifica automaticamente cada transação.',
    color: 'purple'
  },
  {
    status: 'live',
    icon: TrendingUp,
    title: 'Metas de Gastos Personalizadas',
    description: 'Defina metas para cada cartão e visualize seu progresso em tempo real com alertas coloridos.',
    color: 'blue'
  },
  {
    status: 'live',
    icon: PieChart,
    title: 'Análise de Pareto',
    description: 'Identifique instantaneamente onde 80% do seu dinheiro está indo com gráficos intuitivos.',
    color: 'pink'
  },
  {
    status: 'live',
    icon: Users,
    title: 'Gerenciamento de Categorias',
    description: 'Crie, edite e organize categorias com autocomplete inteligente. Sem limites, sem fricção.',
    color: 'orange'
  },
  {
    status: 'live',
    icon: Calendar,
    title: 'Assinaturas Recorrentes',
    description: 'Automatize lançamentos mensais de serviços recorrentes como Netflix, academia e etc.',
    color: 'teal'
  },
  {
    status: 'live',
    icon: FileText,
    title: 'Painel de Auditoria',
    description: 'Visualize o histórico completo de lançamentos ordenado por data de criação para identificar erros.',
    color: 'cyan'
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
    title: 'Integração Bancária (Open Banking)',
    description: 'Conecte suas contas bancárias e sincronize transações automaticamente, sem CSV.',
    eta: 'Q2 2026'
  },
  {
    status: 'planned',
    icon: DollarSign,
    title: 'Controle de Investimentos',
    description: 'Acompanhe ações, fundos e criptomoedas em um só lugar e veja o patrimônio total consolidado.',
    eta: 'Q3 2026'
  },
  {
    status: 'planned',
    icon: Share2,
    title: 'Compartilhamento Familiar',
    description: 'Compartilhe dashboards com família/parceiro(a) mantendo privacidade de dados sensíveis.',
    eta: 'Q3 2026'
  },
  {
    status: 'planned',
    icon: Bell,
    title: 'Alertas Inteligentes',
    description: 'Receba notificações via WhatsApp/Email quando atingir 70%, 90% ou 100% da meta.',
    eta: 'Q4 2026'
  },
  {
    status: 'planned',
    icon: Globe,
    title: 'Multi-Moeda',
    description: 'Gerencie gastos em dólar, euro e outras moedas com conversão automática e histórico de câmbio.',
    eta: 'Q4 2026'
  }
]

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="border-b backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2">
          <div class="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
            D
          </div>
          Due
        </NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm hover:text-primary transition-colors">Home</NuxtLink>
          <NuxtLink to="/features" class="text-sm font-semibold text-primary">Features</NuxtLink>
          <NuxtLink to="/sign-in" class="text-sm hover:text-primary transition-colors">Entrar</NuxtLink>
          <NuxtLink to="/sign-up" class="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
            Começar Grátis
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative py-20 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-10 blur-3xl" />
      <div class="container mx-auto px-4 text-center space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase border border-primary/20">
          <Sparkles class="w-3 h-3" />
          Tudo que você precisa
        </div>
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto">
          Ferramentas <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">poderosas</span> para finanças pessoais
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubra tudo que o Due oferece hoje e o que está por vir no nosso roadmap público.
        </p>
      </div>
    </section>

    <!-- Current Features -->
    <section class="py-16 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-4">
            <Check class="w-3 h-3" />
            Disponível Agora
          </div>
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Recursos já implementados</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Tudo funcionando, testado e pronto para você usar hoje. Sem promessas vazias.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="group relative p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
          >
            <div class="absolute top-4 right-4">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                <Check class="w-2.5 h-2.5" />
                Live
              </span>
            </div>
            
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              :class="`bg-${feature.color}-500/10 text-${feature.color}-600 dark:text-${feature.color}-400`"
            >
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

    <!-- Roadmap -->
    <section class="py-20">
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
            class="group relative p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <!-- Timeline connector -->
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
                <div class="flex items-start justify-between mb-2">
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

        <!-- CTA -->
        <div class="mt-16 text-center space-y-4">
          <p class="text-muted-foreground">Tem uma sugestão de feature?</p>
          <NuxtLink 
            to="/sign-up"
            class="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            Experimente Agora Grátis
          </NuxtLink>
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
          <NuxtLink to="/" class="text-sm hover:text-primary transition-colors">Home</NuxtLink>
          <NuxtLink to="/features" class="text-sm hover:text-primary transition-colors">Features</NuxtLink>
          <NuxtLink to="/sign-in" class="text-sm hover:text-primary transition-colors">Entrar</NuxtLink>
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

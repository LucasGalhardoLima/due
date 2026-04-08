<script setup lang="ts">
import { HelpCircle, Mail, ChevronLeft, Moon, Sun, User, CreditCard, ShieldCheck } from 'lucide-vue-next'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

definePageMeta({
  layout: false
})

useHead({
  title: 'Suporte — Du',
  meta: [
    { name: 'description', content: 'Central de ajuda do Du. Encontre respostas para suas dúvidas sobre conta, cobranças e privacidade, ou entre em contato com nosso suporte.' },
    { property: 'og:title', content: 'Suporte — Du' },
    { property: 'og:description', content: 'Central de ajuda do Du. Encontre respostas para suas dúvidas sobre conta, cobranças e privacidade.' },
    { property: 'og:type', content: 'website' },
  ],
})

interface FaqItem {
  category: string
  question: string
  answer: string
  icon: typeof User
}

const faqs: FaqItem[] = [
  {
    category: 'Conta',
    question: 'Como criar minha conta no Du?',
    answer: 'Basta acessar o Du pelo app ou pelo site e se cadastrar com seu e-mail. A autenticação é gerenciada pelo Clerk, garantindo segurança enterprise para sua conta.',
    icon: User,
  },
  {
    category: 'Conta',
    question: 'Como excluir minha conta?',
    answer: 'Você pode excluir sua conta e todos os seus dados a qualquer momento nas configurações do perfil. A exclusão é imediata e definitiva — todos os dados são removidos permanentemente.',
    icon: User,
  },
  {
    category: 'Conta',
    question: 'Esqueci minha senha. O que fazer?',
    answer: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um e-mail com instruções para redefinir sua senha de forma segura.',
    icon: User,
  },
  {
    category: 'Cobranças',
    question: 'O Du é gratuito?',
    answer: 'Sim, o Du é gratuito para uso pessoal. Nosso objetivo é ajudar você a ter controle total das suas finanças sem custo.',
    icon: CreditCard,
  },
  {
    category: 'Cobranças',
    question: 'Como funciona o parcelamento no Du?',
    answer: 'Ao registrar uma transação parcelada, o Du distribui automaticamente as parcelas nas faturas futuras dos seus cartões, respeitando a data de fechamento de cada cartão.',
    icon: CreditCard,
  },
  {
    category: 'Cobranças',
    question: 'Posso importar transações de outros apps?',
    answer: 'Sim, o Du suporta importação de transações via arquivo CSV. Acesse as configurações e selecione "Importar transações" para começar.',
    icon: CreditCard,
  },
  {
    category: 'Privacidade',
    question: 'Meus dados financeiros estão seguros?',
    answer: 'Sim. Seus dados são isolados por autenticação via Clerk e filtrados por usuário no banco de dados. Nenhum outro usuário pode acessar suas informações.',
    icon: ShieldCheck,
  },
  {
    category: 'Privacidade',
    question: 'O Du compartilha meus dados com terceiros?',
    answer: 'Não compartilhamos seus dados pessoais para fins de marketing ou publicidade. Quando você usa o Advisor AI, enviamos apenas dados necessários para a IA — sem informações que possam te identificar pessoalmente.',
    icon: ShieldCheck,
  },
  {
    category: 'Privacidade',
    question: 'Quais são meus direitos sob a LGPD?',
    answer: 'Você tem direito a acessar, corrigir, portar ou eliminar seus dados pessoais. Para exercer esses direitos, entre em contato pelo e-mail suporte@du.finance ou consulte nossa Política de Privacidade.',
    icon: ShieldCheck,
  },
]

const categories = ['Conta', 'Cobranças', 'Privacidade'] as const
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased transition-colors duration-300">
    <!-- Simple Header -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background">
      <div class="container mx-auto px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
          <ChevronLeft class="w-4 h-4" />
          Voltar
        </NuxtLink>
        <div class="flex items-center gap-4">
          <button class="p-2 rounded-full hover:bg-muted transition-colors" @click="toggleTheme">
            <Moon v-if="colorMode.value === 'light'" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>

    <main class="pt-32 pb-16 container mx-auto px-6 md:px-16 max-w-4xl">
      <div class="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <!-- Header Section -->
        <div class="space-y-4 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary-accent">
            <HelpCircle class="w-8 h-8" />
          </div>
          <h1 class="text-4xl md:text-6xl font-black tracking-tight" style="font-family: var(--font-display)">Suporte</h1>
          <p class="text-xl text-muted-foreground font-medium">Estamos aqui para ajudar. Encontre respostas ou fale conosco.</p>
        </div>

        <!-- Contact Section -->
        <section class="p-8 rounded-3xl bg-secondary/20 border border-border/50 space-y-4">
          <div class="flex items-center gap-3 text-primary">
            <Mail class="w-6 h-6" />
            <h2 class="text-2xl font-bold">Fale Conosco</h2>
          </div>
          <p class="text-muted-foreground leading-relaxed">
            Precisa de ajuda? Envie um e-mail para
            <a href="mailto:suporte@du.finance" class="text-primary font-semibold hover:underline">suporte@du.finance</a>
            e responderemos o mais rápido possível.
          </p>
        </section>

        <!-- FAQ Section -->
        <div class="space-y-8">
          <h2 class="text-2xl font-bold text-center" style="font-family: var(--font-display)">Perguntas Frequentes</h2>

          <div v-for="category in categories" :key="category" class="space-y-4">
            <h3 class="text-lg font-semibold text-muted-foreground uppercase tracking-wider">{{ category }}</h3>
            <div class="grid gap-4">
              <section
                v-for="faq in faqs.filter(f => f.category === category)"
                :key="faq.question"
                class="p-8 rounded-3xl bg-secondary/20 border border-border/50 space-y-3"
              >
                <div class="flex items-center gap-3 text-primary">
                  <component :is="faq.icon" class="w-5 h-5 shrink-0" />
                  <h4 class="text-lg font-bold">{{ faq.question }}</h4>
                </div>
                <p class="text-muted-foreground leading-relaxed pl-8">{{ faq.answer }}</p>
              </section>
            </div>
          </div>
        </div>

        <!-- Privacy Link -->
        <div class="text-center space-y-4">
          <p class="text-muted-foreground">
            Para informações sobre como tratamos seus dados, consulte nossa
            <NuxtLink to="/privacy" class="text-primary font-semibold hover:underline">Política de Privacidade</NuxtLink>.
          </p>
        </div>

        <div class="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          Última atualização: 7 de Abril de 2026
        </div>
      </div>
    </main>

    <footer class="py-12 border-t border-border/40">
      <div class="container mx-auto px-6 text-center text-sm opacity-60">
        &copy; 2026 Du. Suporte ao usuário.
      </div>
    </footer>
  </div>
</template>

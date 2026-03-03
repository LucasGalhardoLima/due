<script setup lang="ts">
import HeroSection from '@/components/landing/HeroSection.vue'
import ProblemSection from '@/components/landing/ProblemSection.vue'
import SolutionSection from '@/components/landing/SolutionSection.vue'
import FeaturesGrid from '@/components/landing/FeaturesGrid.vue'
import AIChatSection from '@/components/landing/AIChatSection.vue'
import BeforeAfterSection from '@/components/landing/BeforeAfterSection.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import CTASection from '@/components/landing/CTASection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

const { userId } = useAuth()
const router = useRouter()

const authMode = ref<'none' | 'sign-in' | 'sign-up'>('none')
const authOpen = computed({
  get: () => authMode.value !== 'none',
  set: (val) => { if (!val) authMode.value = 'none' },
})
const authIntent = computed(() =>
  authMode.value === 'sign-up' ? 'sign-up' : 'sign-in',
)

function openSignIn() {
  authMode.value = 'sign-in'
}

function openSignUp() {
  authMode.value = 'sign-up'
}

function handleDemo() {
  const demoCookie = useCookie('demo_mode', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  demoCookie.value = 'true'
  router.push('/dashboard')
}

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="dark min-h-screen bg-background text-foreground antialiased">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 h-20 bg-background border-b border-white/5 z-50 px-8 lg:px-16 flex items-center justify-between">
      <div class="flex items-center gap-12">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-white rounded-[22%] flex items-center justify-center pulse-avatar">
            <span class="text-black font-black text-[10px]">DU</span>
          </div>
        </NuxtLink>
        <div class="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <a href="#solution-section" class="hover:text-white transition-colors">Como Funciona</a>
          <a href="#features-section" class="hover:text-white transition-colors">Recursos</a>
          <a href="#pricing-section" class="hover:text-white transition-colors">Precos</a>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <button
          class="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          @click="openSignIn"
        >
          Entrar
        </button>
        <button
          class="bg-white text-black px-6 py-3 rounded-full text-[11px] font-bold uppercase hover:bg-neutral-200 transition-all"
          @click="openSignUp"
        >
          Criar Conta
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <!-- Redirect logged in users -->
      <template v-if="userId">
        <div class="min-h-[80vh] flex items-center justify-center">
          <div class="text-center space-y-4">
            <p class="text-muted-foreground">Você já está logado.</p>
            <NuxtLink to="/dashboard" class="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-white text-black font-bold shadow-lg">
              Ir para o Dashboard
            </NuxtLink>
          </div>
        </div>
      </template>

      <template v-else>
        <HeroSection @start="openSignUp" @demo="handleDemo" />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <ProblemSection />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <SolutionSection />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <FeaturesGrid />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <AIChatSection />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <BeforeAfterSection />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <PricingSection @start="openSignUp" />
        <div class="particle-divider"><div class="dot" /><div class="dot" /><div class="dot" /></div>
        <CTASection @start="openSignUp" />
      </template>
    </main>

    <LandingFooter />

    <!-- Auth Modal -->
    <AuthModal v-model:open="authOpen" :intent="authIntent" />
  </div>
</template>

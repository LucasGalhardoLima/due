<script setup lang="ts">
import { Moon, Sun, X } from 'lucide-vue-next'
import HeroSection from '@/components/landing/HeroSection.vue'
import ProblemSection from '@/components/landing/ProblemSection.vue'
import SolutionSection from '@/components/landing/SolutionSection.vue'
import FeaturesGrid from '@/components/landing/FeaturesGrid.vue'
import SocialProof from '@/components/landing/SocialProof.vue'
import CTASection from '@/components/landing/CTASection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

const { userId } = useAuth()
const colorMode = useColorMode()
const router = useRouter()

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
  <div class="min-h-screen bg-background text-foreground font-sans antialiased">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-card/90 backdrop-blur-md">
      <div class="container mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="font-black text-xl flex items-center gap-2 tracking-tight">
          <div class="w-9 h-9 bg-secondary rounded-2xl flex items-center justify-center text-secondary-foreground font-black shadow-elevation-2">
            Du
          </div>
        </NuxtLink>

        <!-- Right side -->
        <div class="flex items-center gap-4">
          <button
            class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Alternar tema"
            @click="toggleTheme"
          >
            <Moon v-if="colorMode.value === 'light'" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>

          <div class="hidden sm:flex items-center gap-4">
            <button
              class="text-sm font-semibold hover:text-primary transition-colors"
              @click="openSignIn"
            >
              Entrar
            </button>
            <button
              class="h-9 px-5 rounded-2xl bg-secondary text-secondary-foreground text-sm font-bold shadow-elevation-2 hover:opacity-90 transition-all"
              @click="openSignUp"
            >
              Criar Conta
            </button>
          </div>

          <!-- Mobile: Just Sign In -->
          <button
            class="sm:hidden text-sm font-semibold hover:text-primary transition-colors"
            @click="openSignIn"
          >
            Entrar
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-16">
      <!-- Redirect logged in users -->
      <template v-if="userId">
        <div class="min-h-[80vh] flex items-center justify-center">
          <div class="text-center space-y-4">
            <p class="text-muted-foreground">Voce ja esta logado.</p>
            <NuxtLink to="/dashboard" class="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-secondary text-secondary-foreground font-bold shadow-elevation-2">
              Ir para o Dashboard
            </NuxtLink>
          </div>
        </div>
      </template>

      <template v-else>
        <HeroSection @start="openSignUp" @demo="handleDemo" />
        <ProblemSection />
        <SolutionSection />
        <FeaturesGrid />
        <SocialProof />
        <CTASection @start="openSignUp" />
      </template>
    </main>

    <LandingFooter />

    <!-- Auth Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="authMode !== 'none'" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-background/80 backdrop-blur-sm"
          @click="closeAuth"
        />

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-card border border-border/70 rounded-[2rem] shadow-elevation-5 overflow-hidden animate-in zoom-in-95 duration-200">
          <button
            class="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10"
            aria-label="Fechar"
            @click="closeAuth"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="flex items-center justify-center p-8 pt-14">
            <SignIn
              v-if="authMode === 'sign-in'"
              after-sign-in-url="/dashboard"
              sign-up-url="#"
              @click.capture="(e: MouseEvent) => {
                const target = e.target as HTMLElement
                if (target.innerText?.includes('Sign up')) {
                  e.stopPropagation()
                  e.preventDefault()
                  openSignUp()
                }
              }"
            />
            <SignUp
              v-if="authMode === 'sign-up'"
              after-sign-up-url="/dashboard"
              sign-in-url="#"
              @click.capture="(e: MouseEvent) => {
                const target = e.target as HTMLElement
                if (target.innerText?.includes('Sign in')) {
                  e.stopPropagation()
                  e.preventDefault()
                  openSignIn()
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
  max-width: 1200px;
}
</style>

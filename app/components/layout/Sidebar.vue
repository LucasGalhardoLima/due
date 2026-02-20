<script setup lang="ts">
import { ref } from 'vue'
import {
  LayoutDashboard,
  CalendarRange,
  Wallet,
  CreditCard,
  Tags,
  UploadCloud,
  ShieldCheck,
  RotateCw,
  TrendingUp,
  Target,
  Menu,
  Moon,
  Sun,
  X,
  ChevronRight,
  LogOut,
  User,
  Sparkles,
  Settings,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import TierBadge from '@/components/tier/TierBadge.vue'

const { user } = useUser()
const clerk = useClerk()
const colorMode = useColorMode()
const isMobileMenuOpen = ref(false)
const { tier, isFree, hasStripe } = useTier()

function handleSignOut() {
  clerk.value?.signOut()
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
const demoCookie = useCookie('demo_mode', { maxAge: 60 * 60 * 24 * 30, path: '/' })
const isDemoMode = computed(() => demoCookie.value === 'true')

async function manageSubscription() {
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/portal', { method: 'POST' })
    if (url) window.location.href = url
  } catch {
    // Silently fail
  }
}

function toggleDemoMode() {
  demoCookie.value = isDemoMode.value ? 'false' : 'true'
  // Force reload to apply session changes
  window.location.reload()
}

const groups = [
  {
    label: 'Visão Geral',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Fluxo de Caixa', path: '/fluxo-de-caixa', icon: TrendingUp },
    ]
  },
  {
    label: 'Gastos',
    items: [
      { name: 'Parcelamentos', path: '/parcelamentos', icon: CalendarRange },
      { name: 'Recorrentes', path: '/recorrentes', icon: RotateCw },
      { name: 'Orçamento', path: '/orcamento', icon: Wallet },
    ]
  },
  {
    label: 'Planejamento',
    items: [
      { name: 'Metas', path: '/metas', icon: Target },
      { name: 'Categorias', path: '/categories', icon: Tags },
    ]
  },
  {
    label: 'Ferramentas',
    items: [
      { name: 'Cartões', path: '/cards', icon: CreditCard },
      { name: 'Importar CSV', path: '/import', icon: UploadCloud },
      { name: 'Auditoria', path: '/audit', icon: ShieldCheck },
    ]
  },
]

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <!-- Mobile Header -->
  <header class="lg:hidden h-14 border-b border-border bg-card sticky top-0 z-40 px-4 flex items-center justify-between">
    <NuxtLink to="/" class="font-bold text-lg flex items-center gap-2">
      <div class="w-8 h-8 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-elevation-2 text-sm">
        Du
      </div>
    </NuxtLink>

    <Button variant="ghost" size="icon" @click="isMobileMenuOpen = true">
      <Menu class="w-5 h-5" />
    </Button>
  </header>

  <!-- Sidebar Container -->
  <aside
    class="fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-sm border-r border-border/70 transition-transform duration-300"
    :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <div class="flex flex-col h-full">
      <!-- Sidebar Header (Desktop) -->
      <div class="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
        <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2">
          <div class="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-elevation-2 text-sm">
            Du
          </div>
        </NuxtLink>
        <Button variant="ghost" size="icon" class="lg:hidden ml-auto" @click="closeMobileMenu">
          <X class="w-5 h-5" />
        </Button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-5">
        <div v-for="group in groups" :key="group.label" class="space-y-2">
          <h3 class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {{ group.label }}
          </h3>
          <div class="space-y-1 rounded-[2rem] border border-border/70 bg-background/70 p-2 shadow-elevation-1 transition-[box-shadow,border-color] duration-200 hover:shadow-elevation-2 hover:border-primary/20">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="relative flex items-center gap-3 px-3.5 py-2.5 rounded-[1.5rem] text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-200 ease-out hover:bg-primary/16 dark:hover:bg-primary/14 hover:text-foreground hover:translate-x-0.5 group before:absolute before:left-1 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 before:scale-y-50 before:transition-all before:duration-200 active:scale-[0.99]"
              :active-class="item.ai ? 'bg-ai-accent/16 text-ai-accent hover:bg-ai-accent/22 before:opacity-100 before:scale-y-100 before:bg-ai-accent shadow-elevation-1 hover:shadow-elevation-2' : 'bg-primary text-primary-foreground shadow-elevation-1 hover:bg-primary/92 hover:shadow-elevation-2 before:opacity-100 before:scale-y-100 before:bg-primary-foreground/80'"
              @click="closeMobileMenu"
            >
              <component :is="item.icon" class="w-4 h-4 opacity-80 transition-all duration-200 group-hover:opacity-100 group-hover:scale-105" />
              <span>{{ item.name }}</span>
              <ChevronRight class="w-4 h-4 ml-auto opacity-0 translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-border/70 bg-secondary/5">
        <div class="flex flex-col gap-4">
          <!-- Profile Section -->
          <div class="flex items-center justify-between px-2 group/profile">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-primary/35 border border-primary/50 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="user?.imageUrl" :src="user.imageUrl" class="h-full w-full object-cover" alt="Avatar" >
                <User v-else class="w-5 h-5 text-primary-foreground opacity-80" />
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold truncate">{{ isDemoMode ? 'Usuário' : (user?.firstName || 'Usuário') }}</span>
                  <TierBadge :tier="tier" />
                </div>
                <span class="text-[10px] text-muted-foreground truncate">{{ user?.primaryEmailAddress?.emailAddress || 'Conta Pessoal' }}</span>
              </div>
            </div>
          </div>

          <!-- Upgrade / Manage Subscription -->
          <div v-if="isFree" class="px-2">
            <button
              class="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-primary/40 border border-primary/50 text-primary-foreground text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-primary/50 hover:shadow-elevation-1"
              @click="useUpgradeModal().show()"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Fazer Upgrade</span>
            </button>
          </div>
          <div v-else-if="hasStripe" class="px-2">
            <button
              class="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-background border border-border hover:bg-secondary/10 hover:border-primary/30 transition-all duration-200 ease-out hover:-translate-y-[1px] text-xs font-medium text-muted-foreground hover:text-foreground"
              @click="manageSubscription"
            >
              <Settings class="w-3.5 h-3.5" />
              <span>Gerenciar assinatura</span>
            </button>
          </div>

          <!-- Actions Row -->
          <div class="flex items-center justify-between px-2 gap-2">
            <button 
              class="flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-background border border-border hover:bg-secondary/10 hover:border-primary/30 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-elevation-1 text-xs font-medium text-muted-foreground hover:text-foreground" 
              aria-label="Alternar Tema"
              @click="toggleTheme"
            >
              <Moon v-if="colorMode.value === 'light'" class="w-3.5 h-3.5" />
              <Sun v-else class="w-3.5 h-3.5" />
              <span>{{ colorMode.value === 'light' ? 'Escuro' : 'Claro' }}</span>
            </button>

            <button
              class="flex items-center justify-center h-9 w-9 rounded-xl bg-background border border-border hover:bg-danger/10 hover:border-danger/20 hover:text-danger transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-elevation-1 text-muted-foreground"
              title="Sair"
              @click="handleSignOut"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>

          <!-- Demo Mode Button (Dev Only) -->
          <div v-if="isDev" class="px-2">
            <button 
              class="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl transition-all duration-200 ease-out hover:-translate-y-[1px] text-xs font-bold border" 
              :class="isDemoMode 
                ? 'bg-warning/10 border-warning/20 text-warning hover:bg-warning/20'
                : 'bg-primary/40 border-primary/50 text-primary-foreground hover:bg-primary/50'"
              @click="toggleDemoMode"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>{{ isDemoMode ? 'Sair do Modo Demo' : 'Ativar Modo Demo' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isMobileMenuOpen"
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
    @click="closeMobileMenu"
  />
</template>

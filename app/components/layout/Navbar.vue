<script setup lang="ts">
import { ref } from 'vue'
import { 
  LayoutDashboard, 
  CalendarRange,
  CreditCard, 
  Tags, 
  UploadCloud, 
  ShieldCheck, 
  Menu,
  Moon,
  Sun,
  X,
  LogOut,
  User
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { user } = useUser()
const clerk = useClerk()
const colorMode = useColorMode()
const isMobileMenuOpen = ref(false)

// Watch route changes to close menu
const route = useRoute()
watch(() => route.path, () => {
    isMobileMenuOpen.value = false
})

function handleSignOut() {
  clerk.value?.signOut()
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Prc.', path: '/parcelamentos', icon: CalendarRange },
  { name: 'Cartões', path: '/cards', icon: CreditCard },
  { name: 'Categorias', path: '/categories', icon: Tags },
  { name: 'Importar', path: '/import', icon: UploadCloud },
  { name: 'Auditoria', path: '/admin/transactions', icon: ShieldCheck },
]

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div>
    <nav class="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-elevation-2">
            D
          </div>
          <span>Due</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-6">
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="text-sm font-medium transition-colors hover:text-primary relative"
            active-class="text-primary font-semibold"
          >
            {{ item.name }}
            <div v-if="$route.path === item.path" class="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full transition-all" />
          </NuxtLink>

          <!-- Actions -->
          <div class="ml-4 flex items-center gap-4">
            <button
              class="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Alternar Tema"
              aria-label="Alternar tema claro/escuro"
              @click="toggleTheme"
            >
              <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>

            <!-- Profile Section -->
            <div class="flex items-center gap-3 pl-2 border-l">
              <div class="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                 <img v-if="user?.imageUrl" :src="user.imageUrl" width="32" height="32" class="h-full w-full object-cover" alt="Avatar do usuário" >
                 <User v-else class="w-4 h-4 text-primary opacity-70" aria-hidden="true" />
              </div>
              <button class="text-muted-foreground hover:text-red-500 transition-colors" title="Sair" aria-label="Sair da conta" @click="handleSignOut">
                <LogOut class="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center gap-2">
           <button 
              class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" 
              @click="toggleTheme"
            >
              <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>
            <Button variant="ghost" size="icon" aria-label="Abrir menu" @click="isMobileMenuOpen = true">
              <Menu class="w-6 h-6" aria-hidden="true" />
            </Button>
        </div>
      </div>
    </nav>

    <!-- Mobile Drawer (Moved outside nav) -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 z-50 md:hidden"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-background/80 backdrop-blur-sm overscroll-contain"
        aria-hidden="true"
        @click="closeMobileMenu"
      />

      <!-- Drawer Panel -->
      <div
        class="absolute inset-y-0 left-0 w-72 bg-card border-r border-border shadow-elevation-4 overflow-hidden"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="h-16 flex items-center px-6 border-b border-border/50 shrink-0 justify-between">
            <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2" @click="closeMobileMenu">
              <div class="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-elevation-2">D</div>
              <span>Due</span>
            </NuxtLink>
            <Button variant="ghost" size="icon" aria-label="Fechar menu" @click="closeMobileMenu">
              <X class="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            <NuxtLink 
              v-for="item in navItems" 
              :key="item.path" 
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all hover:bg-accent"
              active-class="bg-primary/10 text-primary"
              @click="closeMobileMenu"
            >
              <component :is="item.icon" class="w-5 h-5 opacity-70" />
              <span>{{ item.name }}</span>
            </NuxtLink>
          </nav>

          <!-- Footer -->
          <div class="p-6 border-t bg-muted/20 shrink-0">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="user?.imageUrl" :src="user.imageUrl" width="40" height="40" class="h-full w-full object-cover" alt="Avatar do usuário" >
                <User v-else class="w-5 h-5 text-primary opacity-70" aria-hidden="true" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold truncate">{{ user?.firstName || 'Usuário' }}</span>
                <span class="text-xs text-muted-foreground truncate">{{ user?.primaryEmailAddress?.emailAddress }}</span>
              </div>
            </div>
            <Button variant="outline" class="w-full text-red-500 hover:bg-red-500/10 hover:text-red-500" @click="handleSignOut">
              <LogOut class="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

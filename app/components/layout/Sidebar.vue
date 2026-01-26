<script setup lang="ts">
import { ref } from 'vue'
import { 
  LayoutDashboard, 
  CreditCard, 
  Tags, 
  UploadCloud, 
  ShieldCheck, 
  PlusCircle,
  Menu,
  Moon,
  Sun,
  X,
  ChevronRight,
  LogOut,
  User
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { user } = useUser()
const clerk = useClerk()
const colorMode = useColorMode()
const isMobileMenuOpen = ref(false)

function handleSignOut() {
  clerk.value?.signOut()
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const groups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Adicionar Gasto', path: '/add-expense', icon: PlusCircle },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Cartões', path: '/cards', icon: CreditCard },
      { name: 'Categorias', path: '/categories', icon: Tags },
      { name: 'Importar CSV', path: '/import', icon: UploadCloud },
    ]
  },
  {
    label: 'Administração',
    items: [
      { name: 'Auditoria', path: '/admin/transactions', icon: ShieldCheck },
    ]
  }
]

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <!-- Mobile Header -->
  <header class="lg:hidden h-14 border-b border-white/10 backdrop-blur-xl bg-background/70 shadow-glass sticky top-0 z-40 px-4 flex items-center justify-between">
    <NuxtLink to="/" class="font-bold text-lg flex items-center gap-2">
      <div class="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-elevation-2">
        D
      </div>
      <span>Due</span>
    </NuxtLink>

    <Button variant="ghost" size="icon" @click="isMobileMenuOpen = true">
      <Menu class="w-5 h-5" />
    </Button>
  </header>

  <!-- Sidebar Container -->
  <aside
    class="fixed inset-y-0 left-0 z-50 w-64 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border-r border-white/10 shadow-glass transition-transform duration-300 transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:inset-0 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none lg:border-border"
    :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex flex-col h-full">
      <!-- Sidebar Header (Desktop) -->
      <div class="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
        <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-elevation-2">
            D
          </div>
          <span>Due</span>
        </NuxtLink>
        <Button variant="ghost" size="icon" class="lg:hidden ml-auto" @click="closeMobileMenu">
          <X class="w-5 h-5" />
        </Button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-8">
        <div v-for="group in groups" :key="group.label" class="space-y-2">
          <h3 class="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {{ group.label }}
          </h3>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-accent group relative"
              active-class="bg-primary/10 text-primary hover:bg-primary/15"
              @click="closeMobileMenu"
            >
              <component :is="item.icon" class="w-4 h-4 opacity-70 group-hover:opacity-100" />
              <span>{{ item.name }}</span>
              <ChevronRight class="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t bg-muted/20">
        <div class="flex flex-col gap-4">
          <!-- Profile Section -->
          <div class="flex items-center justify-between px-2 group/profile">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="user?.imageUrl" :src="user.imageUrl" class="h-full w-full object-cover" alt="Avatar" />
                <User v-else class="w-5 h-5 text-primary opacity-70" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold truncate">{{ user?.firstName || 'Usuário' }}</span>
                <span class="text-[10px] text-muted-foreground truncate">{{ user?.primaryEmailAddress?.emailAddress || 'Conta Pessoal' }}</span>
              </div>
            </div>
          </div>

          <!-- Actions Row -->
          <div class="flex items-center justify-between px-2 gap-2">
            <button 
              @click="toggleTheme" 
              class="flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-background border border-border hover:bg-accent transition-all text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label="Alternar Tema"
            >
              <Moon v-if="colorMode.value === 'light'" class="w-3.5 h-3.5" />
              <Sun v-else class="w-3.5 h-3.5" />
              <span>{{ colorMode.value === 'light' ? 'Escuro' : 'Claro' }}</span>
            </button>

            <button 
              @click="handleSignOut" 
              class="flex items-center justify-center h-9 w-9 rounded-md bg-background border border-border hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all text-muted-foreground"
              title="Sair"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isMobileMenuOpen"
    class="fixed inset-0 bg-background/80 backdrop-blur-xl z-40 lg:hidden"
    @click="closeMobileMenu"
  ></div>
</template>

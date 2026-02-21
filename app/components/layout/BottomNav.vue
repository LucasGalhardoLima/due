<script setup lang="ts">
import { ref } from 'vue'
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  Target,
  Menu,
  TrendingUp,
  CalendarRange,
  RotateCw,
  Tags,
  CreditCard,
  UploadCloud,
  ShieldCheck,
  ChevronRight,
} from 'lucide-vue-next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'

const route = useRoute()
const isDrawerOpen = ref(false)
const isMoreOpen = ref(false)

const tabs = [
  { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Orçamento', icon: Wallet, path: '/orcamento' },
  { label: 'Adicionar', icon: PlusCircle, path: null }, // opens drawer
  { label: 'Metas', icon: Target, path: '/metas' },
  { label: 'Mais', icon: Menu, path: null }, // opens sheet
] as const

const moreGroups = [
  {
    label: 'Visão Geral',
    items: [
      { name: 'Fluxo de Caixa', path: '/fluxo-de-caixa', icon: TrendingUp },
    ],
  },
  {
    label: 'Gastos',
    items: [
      { name: 'Parcelamentos', path: '/parcelamentos', icon: CalendarRange },
      { name: 'Recorrentes', path: '/recorrentes', icon: RotateCw },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { name: 'Categorias', path: '/categories', icon: Tags },
      { name: 'Cartões', path: '/cards', icon: CreditCard },
      { name: 'Importar CSV', path: '/import', icon: UploadCloud },
      { name: 'Auditoria', path: '/audit', icon: ShieldCheck },
    ],
  },
]

function isActive(path: string | null) {
  if (!path) return false
  return route.path === path || route.path.startsWith(path + '/')
}

function handleTabClick(tab: typeof tabs[number]) {
  if (tab.label === 'Adicionar') {
    isDrawerOpen.value = true
  } else if (tab.label === 'Mais') {
    isMoreOpen.value = true
  }
  // path tabs use NuxtLink, no handler needed
}

function navigateFromMore(path: string) {
  isMoreOpen.value = false
  navigateTo(path)
}

// Check if any "More" path is active
const isMoreActive = computed(() =>
  moreGroups.some(g => g.items.some(item => isActive(item.path)))
)
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background lg:hidden">
    <div class="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
      <template v-for="tab in tabs" :key="tab.label">
        <!-- Regular nav tabs -->
        <NuxtLink
          v-if="tab.path"
          :to="tab.path"
          class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95"
          :class="isActive(tab.path) ? 'text-primary-accent' : 'text-muted-foreground'"
        >
          <component :is="tab.icon" class="w-5 h-5" :class="isActive(tab.path) ? 'stroke-[2.5]' : ''" />
          <span class="text-[10px] font-semibold" :class="isActive(tab.path) ? 'font-bold' : ''">{{ tab.label }}</span>
        </NuxtLink>

        <!-- Center add button -->
        <button
          v-else-if="tab.label === 'Adicionar'"
          class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-primary-accent active:scale-95 transition-transform"
          @click="handleTabClick(tab)"
        >
          <div class="w-11 h-11 -mt-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-elevation-2">
            <PlusCircle class="w-6 h-6" />
          </div>
        </button>

        <!-- More button -->
        <button
          v-else-if="tab.label === 'Mais'"
          class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95"
          :class="isMoreActive ? 'text-primary-accent' : 'text-muted-foreground'"
          @click="handleTabClick(tab)"
        >
          <component :is="tab.icon" class="w-5 h-5" :class="isMoreActive ? 'stroke-[2.5]' : ''" />
          <span class="text-[10px] font-semibold" :class="isMoreActive ? 'font-bold' : ''">{{ tab.label }}</span>
        </button>
      </template>
    </div>

    <!-- Transaction Drawer -->
    <TransactionDrawer v-model:open="isDrawerOpen" />

    <!-- More Sheet -->
    <Sheet v-model:open="isMoreOpen">
      <SheetContent side="bottom" class="rounded-t-3xl max-h-[80vh]">
        <SheetHeader class="pb-2">
          <SheetTitle class="text-lg">Navegação</SheetTitle>
        </SheetHeader>

        <div class="overflow-y-auto space-y-5 pb-8">
          <div v-for="group in moreGroups" :key="group.label" class="space-y-2">
            <h3 class="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ group.label }}
            </h3>
            <div class="space-y-1">
              <button
                v-for="item in group.items"
                :key="item.path"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-muted/50 active:scale-[0.98]"
                :class="isActive(item.path) ? 'bg-primary/10 text-primary-accent font-semibold' : 'text-foreground'"
                @click="navigateFromMore(item.path)"
              >
                <component :is="item.icon" class="w-4.5 h-4.5 opacity-70" />
                <span class="flex-1 text-left">{{ item.name }}</span>
                <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </nav>
</template>

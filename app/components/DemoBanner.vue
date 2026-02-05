<script setup lang="ts">
import { ShieldCheck, X } from 'lucide-vue-next'

const demoCookie = useCookie('demo_mode', { maxAge: 60 * 60 * 24 * 30, path: '/' })
const isDemoMode = computed(() => String(demoCookie.value) === 'true')

function exitDemoMode() {
  demoCookie.value = 'false'
  window.location.reload()
}

// Add a body class when demo mode is active for global visual feedback
useHead({
  bodyAttrs: {
    class: computed(() => isDemoMode.value ? 'is-demo-mode' : '')
  }
})
</script>

<template>
  <div 
    v-if="isDemoMode"
    class="bg-yellow-500 text-black py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-lg animate-in fade-in slide-in-from-top duration-300 border-b border-black/10"
  >
    <div class="flex items-center gap-3">
        <div class="relative">
          <ShieldCheck class="w-5 h-5" />
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-black rounded-full animate-ping"/>
        </div>
        <p class="text-sm font-bold">
            Modo Demo Ativo: <span class="font-normal opacity-90">Explore as funcionalidades com dados fictícios.</span>
        </p>
    </div>
    
    <button 
        class="flex items-center gap-2 bg-black/10 hover:bg-black/20 px-3 py-1 rounded-full text-xs font-bold transition-all border border-black/10"
        @click="exitDemoMode"
    >
        Sair do Modo Demo
        <X class="w-3 h-3" />
    </button>
  </div>
</template>

<style>
/* Global styles for demo mode if needed */
.is-demo-mode .demo-border {
  @apply border-yellow-500/50;
}
</style>

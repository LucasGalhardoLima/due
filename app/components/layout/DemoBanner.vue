<script setup lang="ts">
import { ShieldCheck, X } from 'lucide-vue-next'

const demoCookie = useCookie('demo_mode')
const isDemoMode = computed(() => demoCookie.value === 'true')

function exitDemoMode() {
  demoCookie.value = 'false'
  window.location.reload()
}
</script>

<template>
  <div 
    v-if="isDemoMode"
    class="bg-yellow-500 text-black py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-lg animate-in fade-in slide-in-from-top duration-300"
  >
    <div class="flex items-center gap-3">
        <ShieldCheck class="w-5 h-5" />
        <p class="text-sm font-bold">
            Modo Demo Ativo: <span class="font-normal">Explore as funcionalidades com dados fictícios.</span>
        </p>
    </div>
    
    <button 
        @click="exitDemoMode"
        class="flex items-center gap-2 bg-black/10 hover:bg-black/20 px-3 py-1 rounded-full text-xs font-bold transition-all border border-black/10"
    >
        Sair do Modo Demo
        <X class="w-3 h-3" />
    </button>
  </div>
</template>

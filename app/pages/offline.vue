<script setup lang="ts">
import { WifiOff, RefreshCw } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

function retry() {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center space-y-6">
      <!-- Icon -->
      <div class="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
        <WifiOff class="w-10 h-10 text-muted-foreground" />
      </div>

      <!-- Message -->
      <div class="space-y-2">
        <h1 class="text-2xl font-black tracking-tight">Voce esta offline</h1>
        <p class="text-muted-foreground">
          Parece que voce perdeu a conexao com a internet. Verifique sua conexao e tente novamente.
        </p>
      </div>

      <!-- Retry Button -->
      <button
        class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-primary-foreground font-bold shadow-elevation-2 hover:opacity-90 transition-all"
        @click="retry"
      >
        <RefreshCw class="w-5 h-5" />
        Tentar novamente
      </button>

      <!-- Logo -->
      <div class="pt-8 flex items-center justify-center gap-2 text-muted-foreground">
        <div class="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-[10px] font-black">
          Du
        </div>
        <span class="font-bold">Du</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, X } from 'lucide-vue-next'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showPrompt = ref(false)
const isInstalled = ref(false)

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e as BeforeInstallPromptEvent
  
  // Check if already dismissed recently
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedDate = new Date(dismissed)
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissed < 7) return // Don't show for 7 days after dismissal
  }
  
  // Delay showing the prompt for better UX
  setTimeout(() => {
    showPrompt.value = true
  }, 3000)
}

async function installPWA() {
  if (!deferredPrompt.value) return
  
  await deferredPrompt.value.prompt()
  const choice = await deferredPrompt.value.userChoice
  
  if (choice.outcome === 'accepted') {
    isInstalled.value = true
  }
  
  deferredPrompt.value = null
  showPrompt.value = false
}

function dismissPrompt() {
  showPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
}

function checkIfInstalled() {
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
  }
}

onMounted(() => {
  checkIfInstalled()
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    showPrompt.value = false
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div 
      v-if="showPrompt && !isInstalled" 
      class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
    >
      <div class="bg-card border border-border rounded-2xl p-4 shadow-lg shadow-foreground/10">
        <div class="flex items-start gap-4">
          <!-- App icon -->
          <div class="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 shrink-0">
            Du
          </div>
          
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-sm mb-1">Instalar Du</h3>
            <p class="text-xs text-muted-foreground mb-3">
              Acesse mais rápido direto da sua tela inicial. Funciona offline!
            </p>
            
            <div class="flex items-center gap-2">
              <button
                class="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                @click="installPWA"
              >
                <Download class="w-4 h-4" />
                Instalar
              </button>
              <button
                class="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
                @click="dismissPrompt"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

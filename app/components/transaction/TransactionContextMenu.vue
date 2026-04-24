<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Pencil } from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'

const props = defineProps<{
  x: number
  y: number
  transaction: {
    id: string
    description: string
    amount: number
    purchaseDate: string
    category: string
    installmentNumber: number
    totalInstallments: number
  }
}>()

const emit = defineEmits<{
  close: []
  edit: [id: string]
}>()

const chat = useChat()

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function askDu() {
  const { description, amount, purchaseDate, category, installmentNumber, totalInstallments } = props.transaction
  const installmentNote = totalInstallments > 1
    ? ` (parcela ${installmentNumber}/${totalInstallments})`
    : ''
  const question = `Fale sobre essa transação: ${description}${installmentNote} — ${formatCurrency(amount)} em ${purchaseDate}. Categoria: ${category}.`
  emit('close')
  chat.open({ preloadedMessage: question })
}

function handleEdit() {
  emit('edit', props.transaction.id)
  emit('close')
}

function handleClickOutside() {
  emit('close')
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, { once: true })
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Clamp position to viewport
const menuRef = ref<HTMLElement | null>(null)
const clampedX = ref(props.x)
const clampedY = ref(props.y)

onMounted(() => {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  if (props.x + rect.width > window.innerWidth - 8) {
    clampedX.value = window.innerWidth - rect.width - 8
  }
  if (props.y + rect.height > window.innerHeight - 8) {
    clampedY.value = props.y - rect.height
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="fixed z-[100] min-w-[200px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden py-1"
      :style="{ top: `${clampedY}px`, left: `${clampedX}px` }"
      role="menu"
      @click.stop
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[hsl(168_64%_45%)] hover:bg-muted transition-colors"
        @click="askDu"
      >
        <span class="text-base leading-none" aria-hidden="true">✦</span>
        Perguntar ao Du sobre isso
      </button>
      <div class="mx-3 border-t border-border/50" />
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        @click="handleEdit"
      >
        <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
        Editar
      </button>
    </div>
  </Teleport>
</template>

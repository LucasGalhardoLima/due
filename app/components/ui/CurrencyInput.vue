<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  modelValue: number
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const formattedValue = computed(() => {
  if (props.modelValue === 0 && !isFocused.value) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(props.modelValue)
})

const isFocused = ref(false)
const rawInput = ref('')

watch(() => props.modelValue, (val) => {
    // If external change happens
    if (val === 0) rawInput.value = ''
})

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '')
  
  // Convert raw string of digits to number (cents)
  const numberValue = Number(raw) / 100
  
  emit('update:modelValue', numberValue)
  
  // Force update display to keep formatting consistent while typing? 
  // Usually better to show formatted value.
  // Simple "Shift Left" logic:
  // User types '1' -> 0,01
  // Types '0' -> 0,10
  // Types '0' -> 1,00
}

// Better approach for Vue:
// Use a computed getter/setter or just direct input handling.
// Let's stick to a simple text input that formats on blur, or formats as we type (harder).
// "Shift Left" is the best for currency on mobile.

const displayValue = computed(() => {
    if (props.modelValue === 0) return ''
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(props.modelValue)
})

function onInput(e: InputEvent) {
    const el = e.target as HTMLInputElement
    // We only care about digits
    const clean = el.value.replace(/\D/g, '')
    const val = Number(clean) / 100
    emit('update:modelValue', val)
    
    // We need to re-format the input value immediately to give that "mask" feel
    // But setting el.value moves cursor to end.
    // For MVP, moving cursor to end is fine for "Price" input usually.
    el.value = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(val)
}

</script>

<template>
  <div class="relative">
    <input
      type="text"
      inputmode="numeric"
      :value="displayValue"
      @input="onInput"
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right font-mono text-lg"
      :placeholder="placeholder || 'R$ 0,00'"
    />
  </div>
</template>

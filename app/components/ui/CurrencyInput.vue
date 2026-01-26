<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  placeholder?: string
  id?: string
}>()

const emit = defineEmits(['update:modelValue'])



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
      :id="id"
      type="text"
      inputmode="numeric"
      name="currency-value"
      autocomplete="off"
      :value="displayValue"
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right font-mono text-lg tabular-nums"
      :placeholder="placeholder || 'R$ 0,00'"
      @input="onInput"
    >
  </div>
</template>

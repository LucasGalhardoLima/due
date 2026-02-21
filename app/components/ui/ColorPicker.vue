<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const colors = [
  '#D6FFF6', '#231651', '#7DE289', '#282423', '#FBFBFB',
  '#CF4814', '#EAEF3A', '#DB805D', '#438DDE', '#868E96',
  '#FFB3B3', '#FFDAB3', '#FFF3B3', '#B3FFD9', '#B3F0FF',
  '#FF6B6B', '#FFA94D', '#69DB7C', '#4DABF7', '#DA77F2',
  '#C92A2A', '#E67700', '#2B8A3E', '#1864AB', '#862E9C',
]

const selectedColor = computed(() => props.modelValue)

function selectColor(color: string) {
  emit('update:modelValue', color)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      class="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:border-primary/30 transition-all duration-200 overflow-hidden"
      :style="selectedColor ? { backgroundColor: selectedColor } : {}"
      :class="!selectedColor && 'bg-background'"
      @click="isOpen = !isOpen"
    >
      <span v-if="!selectedColor" class="text-muted-foreground text-xs">🎨</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-2 left-0 w-56 rounded-2xl border border-border bg-popover shadow-elevation-3 p-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="color in colors"
          :key="color"
          type="button"
          class="h-8 w-8 rounded-lg transition-all duration-150 hover:scale-110"
          :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-background': selectedColor === color }"
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        />
      </div>
    </div>
  </div>
</template>

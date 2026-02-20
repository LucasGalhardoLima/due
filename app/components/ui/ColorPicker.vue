<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const colors = [
  '#D6FFF6', '#BFF5E8', '#8FE6D2', '#64CCB8', '#3DAF9E',
  '#9B8CEA', '#7561D8', '#4E3EA8', '#231651', '#5B4FA0',
  '#FF6B6B', '#FF8E72', '#FFA94D', '#FFD43B', '#A9E34B',
  '#69DB7C', '#38D9A9', '#22B8CF', '#4DABF7', '#748FFC',
  '#DA77F2', '#E599F7', '#F06595', '#FF922B', '#868E96',
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

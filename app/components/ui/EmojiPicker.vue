<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const categories: { label: string; emojis: string[] }[] = [
  {
    label: 'Finanças',
    emojis: ['💰', '💳', '🏦', '💵', '💸', '🪙', '📊', '📈', '📉', '🧾', '💎', '🏧'],
  },
  {
    label: 'Comida',
    emojis: ['🍽️', '🛒', '☕', '🍕', '🍔', '🥗', '🍺', '🍷', '🧁', '🍣', '🥡', '🫘'],
  },
  {
    label: 'Transporte',
    emojis: ['🚗', '⛽', '🚌', '✈️', '🚇', '🚲', '🛵', '🚕', '🅿️', '🛞', '🚢', '🚁'],
  },
  {
    label: 'Casa',
    emojis: ['🏠', '🔑', '💡', '🛋️', '🧹', '🔧', '🛁', '🪴', '📦', '🚿', '🏗️', '🧊'],
  },
  {
    label: 'Saúde',
    emojis: ['💊', '🏥', '🩺', '🧘', '💪', '🏃', '🦷', '👁️', '🩹', '💉', '🧬', '🩻'],
  },
  {
    label: 'Educação',
    emojis: ['📚', '🎓', '✏️', '💻', '🧠', '📝', '🔬', '🎒', '📖', '🏫', '🧮', '📐'],
  },
  {
    label: 'Lazer',
    emojis: ['🎮', '🎬', '🎵', '🏖️', '🎨', '📸', '🎯', '🎪', '🎲', '🎸', '🎭', '🎻'],
  },
  {
    label: 'Compras',
    emojis: ['🛍️', '👗', '👟', '📱', '⌚', '🖥️', '🎁', '💄', '👜', '🧢', '👔', '🕶️'],
  },
  {
    label: 'Outros',
    emojis: ['🐾', '👶', '💍', '🎄', '📞', '🔒', '⭐', '🌟', '❤️', '🔔', '📌', '🏷️'],
  },
]

const selectedEmoji = computed(() => props.modelValue)

function selectEmoji(emoji: string) {
  emit('update:modelValue', emoji)
  isOpen.value = false
}

function clearEmoji() {
  emit('update:modelValue', null)
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
      class="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center text-lg hover:bg-muted/40 hover:border-primary/30 transition-all duration-200"
      @click="isOpen = !isOpen"
    >
      <span v-if="selectedEmoji">{{ selectedEmoji }}</span>
      <span v-else class="text-muted-foreground text-sm">+</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-2 left-0 w-72 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover shadow-elevation-3 p-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div v-for="group in categories" :key="group.label" class="mb-3 last:mb-0">
        <p class="text-micro text-muted-foreground font-medium mb-1.5 px-1">{{ group.label }}</p>
        <div class="grid grid-cols-6 gap-1">
          <button
            v-for="emoji in group.emojis"
            :key="emoji"
            type="button"
            class="h-9 w-9 rounded-lg flex items-center justify-center text-lg hover:bg-primary/10 transition-colors"
            :class="{ 'bg-primary/15 ring-1 ring-primary/30': selectedEmoji === emoji }"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <button
        v-if="selectedEmoji"
        type="button"
        class="w-full mt-2 pt-2 border-t border-border text-small text-muted-foreground hover:text-danger transition-colors text-center py-1.5"
        @click="clearEmoji"
      >
        Remover emoji
      </button>
    </div>
  </div>
</template>

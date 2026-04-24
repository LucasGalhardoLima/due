<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const props = defineProps<{
  question: string
  label?: string
}>()

const chat = useChat()

function ask() {
  chat.open({ preloadedMessage: props.question })
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-full bg-[hsl(168_64%_70%_/_0.15)] hover:bg-[hsl(168_64%_70%_/_0.25)] border border-[hsl(168_64%_70%_/_0.3)] px-2 py-0.5 text-[11px] font-medium text-[hsl(168_64%_45%)] leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(168_64%_70%_/_0.5)] select-none"
    :aria-label="`Perguntar ao Du: ${question}`"
    @click.stop="ask"
  >
    <span aria-hidden="true">✦</span>
    <span>{{ label ?? 'perguntar' }}</span>
  </button>
</template>

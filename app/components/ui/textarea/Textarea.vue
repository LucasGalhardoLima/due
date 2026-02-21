<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    :class="cn('flex min-h-[120px] w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm transition-all duration-200 ease-out placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/55 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-background hover:border-primary/35 hover:shadow-elevation-1 resize-none', props.class)"
  />
</template>

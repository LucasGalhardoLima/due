<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ai-accent' | 'muted'
}>(), {
  size: 'sm',
  variant: 'primary',
})

const sizeClasses: Record<string, string> = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground shadow-elevation-2',
  'ai-accent': 'bg-ai-accent text-ai-accent-foreground shadow-elevation-2',
  muted: 'bg-muted text-muted-foreground',
}
</script>

<template>
  <div
    :class="[
      'rounded-xl flex items-center justify-center font-black shrink-0 select-none',
      sizeClasses[props.size],
      variantClasses[props.variant],
    ]"
  >
    Du
  </div>
</template>

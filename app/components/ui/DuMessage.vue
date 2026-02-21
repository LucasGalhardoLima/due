<script setup lang="ts">
import DuAvatar from '@/components/ui/DuAvatar.vue'

withDefaults(defineProps<{
  message: string
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ai-accent' | 'muted'
}>(), {
  avatarSize: 'sm',
  variant: 'primary',
})
</script>

<template>
  <div class="flex items-start gap-3">
    <DuAvatar :size="avatarSize" :variant="variant" />
    <p class="text-sm text-muted-foreground leading-relaxed pt-1">
      {{ message }}
    </p>
  </div>
</template>

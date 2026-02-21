<script setup lang="ts">
import { type Component } from 'vue'
import { Button } from '@/components/ui/button'
import DuAvatar from '@/components/ui/DuAvatar.vue'

const props = defineProps<{
  icon: Component
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}>()

const emit = defineEmits<{
  action: []
}>()

function handleAction() {
  if (props.actionTo) {
    navigateTo(props.actionTo)
  } else {
    emit('action')
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
    <div class="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
      <component :is="icon" class="w-7 h-7 text-muted-foreground/60" />
    </div>
    <div class="flex items-start gap-3 max-w-xs">
      <DuAvatar size="xs" variant="muted" class="mt-0.5" />
      <div class="text-left space-y-1">
        <p class="text-sm font-semibold text-foreground">{{ title }}</p>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ description }}</p>
      </div>
    </div>
    <Button
      v-if="actionLabel"
      variant="outline"
      size="sm"
      class="mt-2"
      @click="handleAction"
    >
      {{ actionLabel }}
    </Button>
  </div>
</template>

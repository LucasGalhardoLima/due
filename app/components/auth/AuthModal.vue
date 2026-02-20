<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  intent?: 'sign-in' | 'sign-up'
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md p-8">
      <DialogTitle class="sr-only">Autenticacao</DialogTitle>
      <DialogDescription class="sr-only">Entre ou crie sua conta</DialogDescription>
      <AuthForm :initial-intent="intent" />
    </DialogContent>
  </Dialog>
</template>

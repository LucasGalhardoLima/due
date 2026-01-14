<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const isOpen = defineModel<boolean>('open')

defineProps<{
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits(['confirm'])

function onConfirm() {
  emit('confirm')
  isOpen.value = false
}
</script>

<template>
  <AlertDialog :open="isOpen" @update:open="(val) => isOpen = val">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title || 'Tem certeza?' }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ description || 'Esta ação não pode ser desfeita.' }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ cancelText || 'Cancelar' }}</AlertDialogCancel>
        <AlertDialogAction @click="onConfirm">{{ confirmText || 'Continuar' }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

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

const props = defineProps<{
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits(['update:open', 'confirm'])

function onConfirm() {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="(val) => emit('update:open', val)">
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

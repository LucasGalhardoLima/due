<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Loader2, Lock } from 'lucide-vue-next'

const { canUse } = useTier()
const canRollover = computed(() => canUse('budgetRollover'))

const props = defineProps<{
  open: boolean
  categoryId: string | null
  categoryName: string
  budgetLimit: number | null
  rolloverEnabled?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const amount = ref<number | undefined>(undefined)
const rollover = ref(false)
const isSubmitting = ref(false)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    amount.value = props.budgetLimit ?? undefined
    rollover.value = props.rolloverEnabled ?? false
  }
})

async function onSubmit() {
  if (amount.value === undefined || amount.value < 0) {
    toast.error('Informe um valor válido')
    return
  }

  if (!props.categoryId) return

  isSubmitting.value = true
  try {
    await $fetch(`/api/category-budgets/${props.categoryId}`, {
      method: 'PUT',
      body: { amount: amount.value, rolloverEnabled: rollover.value },
    })
    toast.success('Meta atualizada!')
    emit('saved')
    emit('update:open', false)
  } catch {
    toast.error('Erro ao salvar meta')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Meta de gastos</DrawerTitle>
        <p class="text-sm text-muted-foreground">{{ categoryName }}</p>
      </DrawerHeader>

      <div class="px-4 space-y-4">
        <div class="space-y-2">
          <Label for="budget-amount">Limite mensal (R$)</Label>
          <Input
            id="budget-amount"
            v-model.number="amount"
            type="number"
            placeholder="0,00"
            min="0"
            step="0.01"
          />
          <p class="text-xs text-muted-foreground">
            Defina 0 para apenas acompanhar os gastos sem limite.
          </p>
        </div>

        <div class="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/70" :class="!canRollover && 'opacity-60'">
          <div>
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-medium">Rollover</p>
              <Lock v-if="!canRollover" class="w-3 h-3 text-muted-foreground" />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ canRollover ? 'Saldo não gasto acumula para o mês seguinte' : 'Disponível no plano Plus' }}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="rollover"
            :disabled="!canRollover"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
            :class="rollover && canRollover ? 'bg-primary' : 'bg-muted-foreground/30'"
            @click="canRollover && (rollover = !rollover)"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
              :class="rollover && canRollover ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <DrawerFooter>
        <Button :disabled="isSubmitting" class="w-full" @click="onSubmit">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          Salvar
        </Button>
        <Button variant="outline" class="w-full" @click="emit('update:open', false)">
          Cancelar
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

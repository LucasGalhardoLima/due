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
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  month: number
  year: number
  incomeId?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const description = ref('')
const amount = ref<number | undefined>(undefined)
const isRecurring = ref(true)
const isSubmitting = ref(false)

const isEdit = computed(() => !!props.incomeId)

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.incomeId) {
    try {
      const data = await $fetch<{
        description: string
        amount: number
        isRecurring: boolean
      }>(`/api/income/${props.incomeId}`)
      description.value = data.description
      amount.value = data.amount
      isRecurring.value = data.isRecurring
    } catch {
      toast.error('Erro ao carregar receita')
      emit('update:open', false)
    }
  } else if (isOpen) {
    description.value = ''
    amount.value = undefined
    isRecurring.value = true
  }
})

async function onSubmit() {
  if (!description.value.trim() || !amount.value || amount.value <= 0) {
    toast.error('Preencha todos os campos corretamente')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      description: description.value.trim(),
      amount: amount.value,
      isRecurring: isRecurring.value,
      month: props.month,
      year: props.year,
    }

    if (isEdit.value) {
      await $fetch(`/api/income/${props.incomeId}`, {
        method: 'PUT',
        body: payload,
      })
      toast.success('Receita atualizada!')
    } else {
      await $fetch('/api/income', {
        method: 'POST',
        body: payload,
      })
      toast.success('Receita adicionada!')
    }

    emit('saved')
    emit('update:open', false)
  } catch {
    toast.error('Erro ao salvar receita')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{{ isEdit ? 'Editar Receita' : 'Nova Receita' }}</DrawerTitle>
      </DrawerHeader>

      <div class="px-4 space-y-4">
        <div class="space-y-2">
          <Label for="income-desc">Descrição</Label>
          <Input
            id="income-desc"
            v-model="description"
            placeholder="Ex: Salário, Freelance..."
            maxlength="100"
          />
        </div>

        <div class="space-y-2">
          <Label for="income-amount">Valor (R$)</Label>
          <Input
            id="income-amount"
            v-model.number="amount"
            type="number"
            placeholder="0,00"
            min="0.01"
            step="0.01"
          />
        </div>

        <div class="flex items-center justify-between">
          <Label for="income-recurring" class="cursor-pointer">Receita recorrente (mensal)</Label>
          <button
            id="income-recurring"
            type="button"
            role="switch"
            :aria-checked="isRecurring"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            :class="isRecurring ? 'bg-primary' : 'bg-muted'"
            @click="isRecurring = !isRecurring"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out"
              :class="isRecurring ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <DrawerFooter>
        <Button :disabled="isSubmitting" class="w-full" @click="onSubmit">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          {{ isEdit ? 'Salvar' : 'Adicionar' }}
        </Button>
        <Button variant="outline" class="w-full" @click="emit('update:open', false)">
          Cancelar
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

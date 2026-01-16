<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Trash2, Edit2, Check, X, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

interface Category {
  id: string
  name: string
}

const { data: categories, refresh } = await useFetch<Category[]>('/api/categories')

const form = reactive({
  name: '',
})

const editingId = ref<string | null>(null)
const editingName = ref('')

async function onSubmit() {
  if (!form.name.trim()) return

  try {
    await $fetch('/api/categories', {
      method: 'POST' as any,
      body: { name: form.name }
    })
    
    form.name = ''
    await refresh()
    toast.success('Categoria adicionada!')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao adicionar categoria')
  }
}

function startEdit(cat: Category) {
  editingId.value = cat.id
  editingName.value = cat.name
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit() {
  if (!editingId.value || !editingName.value.trim()) return

  try {
    await $fetch(`/api/categories/${editingId.value}`, {
      method: 'PUT' as any,
      body: { name: editingName.value }
    })
    
    editingId.value = null
    editingName.value = ''
    await refresh()
    toast.success('Categoria atualizada!')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao atualizar categoria')
  }
}

// Confirm Dialog State
const showConfirm = ref(false)
const categoryToDelete = ref<string | null>(null)

function confirmDelete(id: string) {
  categoryToDelete.value = id
  showConfirm.value = true
}

async function handleDelete() {
  if (!categoryToDelete.value) return
  
  try {
    await $fetch(`/api/categories/${categoryToDelete.value}`, { method: 'DELETE' as any })
    await refresh()
    toast.success('Categoria removida com sucesso')
  } catch (e: any) {
    console.error(e)
    const errorMsg = e.data?.statusMessage || 'Erro ao remover categoria'
    toast.error(errorMsg)
  } finally {
    showConfirm.value = false
    categoryToDelete.value = null
  }
}
</script>

<template>
  <div class="container mx-auto py-10 max-w-2xl space-y-8">
    <div class="flex items-center gap-3">
        <div class="bg-primary/10 p-3 rounded-full">
            <Plus class="w-6 h-6 text-primary" />
        </div>
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Categorias</h1>
            <p class="text-muted-foreground">Organize seus gastos por tipo.</p>
        </div>
    </div>
    
    <!-- Add Category Form -->
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <form class="flex gap-4 items-end" @submit.prevent="onSubmit">
          <div class="flex-grow space-y-2">
            <label class="text-sm font-medium leading-none" for="name">Nova Categoria</label>
            <input 
              id="name" 
              v-model="form.name" 
              placeholder="Ex: Educação, Lazer..." 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
          
          <button 
            type="submit" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Adicionar
          </button>
        </form>
    </div>

    <!-- Categories List -->
    <div class="bg-card rounded-lg border shadow-sm divide-y">
      <div v-for="cat in categories" :key="cat.id" class="p-4 flex items-center justify-between group">
        <div v-if="editingId === cat.id" class="flex-grow flex gap-2">
            <input 
              v-model="editingName" 
              class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
              v-focus
            >
            <button class="p-2 hover:text-green-600 transition-colors" @click="saveEdit">
                <Check class="h-4 w-4" />
            </button>
            <button class="p-2 hover:text-red-600 transition-colors" @click="cancelEdit">
                <X class="h-4 w-4" />
            </button>
        </div>
        <template v-else>
            <span class="font-medium">{{ cat.name }}</span>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  class="p-2 hover:bg-muted rounded-md transition-colors" 
                  @click="startEdit(cat)"
                  title="Editar"
                >
                    <Edit2 class="h-4 w-4 text-muted-foreground" />
                </button>
                <button 
                  class="p-2 hover:bg-destructive/10 rounded-md transition-colors" 
                  @click="confirmDelete(cat.id)"
                  title="Remover"
                  v-if="cat.name.toLowerCase() !== 'outros'"
                >
                    <Trash2 class="h-4 w-4 text-destructive" />
                </button>
            </div>
        </template>
      </div>
      
      <div v-if="!categories?.length" class="p-12 text-center text-muted-foreground">
          Nenhuma categoria cadastrada.
      </div>
    </div>
    
    <!-- Confirm Dialog -->
    <ConfirmDialog 
      v-model:open="showConfirm"
      title="Remover categoria?"
      description="Esta ação moverá todas as transações desta categoria para 'Outros'. A exclusão da categoria não pode ser desfeita."
      confirm-text="Sim, remover"
      cancel-text="Cancelar"
      @confirm="handleDelete"
    />
    
  </div>
</template>

<script lang="ts">
// Helper directive to auto-focus inputs
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}
</script>

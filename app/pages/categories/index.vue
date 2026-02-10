<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Trash2, Edit2, Check, X, Tags as TagsIcon, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Card } from '@/components/ui/card'
import ListSkeleton from '@/components/ui/ListSkeleton.vue'

interface Category {
  id: string
  name: string
}

const { data: categories, refresh, status } = useFetch<Category[]>('/api/categories')

const form = reactive({
  name: '',
})

const editingId = ref<string | null>(null)
const editingName = ref('')

async function onSubmit() {
  if (!form.name.trim()) return

  try {
    await $fetch('/api/categories', {
      method: 'POST',
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
      method: 'PUT',
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
    await $fetch(`/api/categories/${categoryToDelete.value}`, { method: 'DELETE' })
    await refresh()
    toast.success('Categoria removida com sucesso')
  } catch (error) {
    console.error(error)
    const errorMsg = error instanceof Error ? error.message : 'Erro ao remover categoria'
    toast.error(errorMsg)
  } finally {
    showConfirm.value = false
    categoryToDelete.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader 
      title="Categorias" 
      subtitle="Organize seus gastos por tipo para uma melhor análise."
      :icon="TagsIcon"
    />
    
    <ListSkeleton v-if="status === 'pending'" :columns="1" :items="5" />

    <template v-else>
      <!-- Add Category Form (Standardized) -->
      <div class="rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-elevation-2 overflow-hidden">
          <div class="bg-secondary/5 px-6 py-4 border-b border-border/60 flex items-center gap-2">
              <Plus class="w-4 h-4 text-primary" />
              <h3 class="text-micro text-muted-foreground">Nova Categoria</h3>
          </div>
          <div class="p-8">
              <form class="flex gap-4 items-end" @submit.prevent="onSubmit">
                <div class="flex-grow space-y-2">
                  <label class="text-micro text-muted-foreground ml-1" for="name">Nome da Categoria</label>
                  <input
                    id="name"
                    v-model="form.name"
                    placeholder="Ex: Educacao, Lazer, Saude..."
                    class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all shadow-elevation-1"
                    required
                  >
                </div>
  
                <button
                  type="submit"
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 active:scale-[0.98] shadow-elevation-2"
                >
                  Adicionar
                </button>
              </form>
          </div>
      </div>
  
      <!-- Categories List (Standardized Card) -->
      <Card class="divide-y divide-border overflow-hidden rounded-[2rem]">
        <div v-for="cat in categories" :key="cat.id" class="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors">
          <div v-if="editingId === cat.id" class="flex-grow flex gap-2">
              <input
                v-model="editingName"
                v-focus
                class="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all shadow-elevation-1"
                aria-label="Editar nome da categoria"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
              >
              <button class="p-2 text-success hover:bg-success/10 rounded-xl transition-all" aria-label="Confirmar edição" @click="saveEdit">
                  <Check class="h-4 w-4" />
              </button>
              <button class="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all" aria-label="Cancelar edição" @click="cancelEdit">
                  <X class="h-4 w-4" />
              </button>
          </div>
          <template v-else>
              <span class="text-body font-semibold text-foreground/80">{{ cat.name }}</span>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-2 hover:bg-primary/10 rounded-xl transition-colors"
                    title="Editar"
                    aria-label="Editar categoria"
                    @click="startEdit(cat)"
                  >
                      <Edit2 class="h-4 w-4 text-primary" />
                  </button>
                  <button
                    v-if="cat.name.toLowerCase() !== 'outros'"
                    class="p-2 hover:bg-destructive/10 rounded-xl transition-colors text-muted-foreground hover:text-destructive shrink-0"
                    title="Remover"
                    aria-label="Remover categoria"
                    @click="confirmDelete(cat.id)"
                  >
                      <Trash2 class="h-4 w-4" />
                  </button>
              </div>
          </template>
        </div>
  
        <div v-if="!categories?.length" class="p-12 text-center text-body text-muted-foreground">
            Nenhuma categoria cadastrada.
        </div>
      </Card>
    </template>
    
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

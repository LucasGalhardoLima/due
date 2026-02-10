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
const categoriesCount = computed(() => categories.value?.length ?? 0)

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
  <div class="app-page animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader 
      title="Categorias" 
      subtitle="Organize seus gastos por tipo para uma melhor análise."
      :icon="TagsIcon"
    />
    
    <ListSkeleton v-if="status === 'pending'" :columns="1" :items="5" />

    <template v-else>
      <!-- Add Category Form (Standardized) -->
      <div class="rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-elevation-2 overflow-hidden transition-all duration-300 hover:shadow-elevation-3 hover:border-primary/25">
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
                    class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                    required
                  >
                </div>
  
                <button
                  type="submit"
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 active:scale-[0.98] hover:-translate-y-[1px] shadow-elevation-2 hover:shadow-elevation-3"
                >
                  Adicionar
                </button>
              </form>
          </div>
      </div>
  
      <div class="grid gap-4 md:grid-cols-2">
        <Card class="p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevation-3">
          <p class="text-micro text-muted-foreground">Categorias ativas</p>
          <p class="text-h2 mt-1">{{ categoriesCount }}</p>
        </Card>
        <Card class="p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevation-3">
          <p class="text-micro text-muted-foreground">Sugestão</p>
          <p class="text-small mt-1 text-muted-foreground">Mantenha categorias objetivas para melhorar os insights e relatórios.</p>
        </Card>
      </div>
  
      <!-- Categories List (Standardized Card) -->
      <Card class="overflow-hidden rounded-[2rem] border border-border/70 shadow-elevation-2 transition-all duration-300 hover:shadow-elevation-3">
        <div class="bg-secondary/5 px-6 py-4 border-b border-border/60">
          <h3 class="text-micro text-muted-foreground">Categorias Cadastradas</h3>
        </div>
        <div class="divide-y divide-border/70">
        <div v-for="cat in categories" :key="cat.id" class="p-4 md:p-5 flex items-center justify-between gap-3 group hover:bg-muted/40 transition-all duration-200">
          <div v-if="editingId === cat.id" class="flex-grow flex gap-2">
              <input
                v-model="editingName"
                v-focus
                class="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                aria-label="Editar nome da categoria"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
              >
              <button class="p-2 text-success hover:bg-success/10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-[0.97]" aria-label="Confirmar edição" @click="saveEdit">
                  <Check class="h-4 w-4" />
              </button>
              <button class="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-[0.97]" aria-label="Cancelar edição" @click="cancelEdit">
                  <X class="h-4 w-4" />
              </button>
          </div>
          <template v-else>
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/20">
                  <TagsIcon class="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:scale-105" />
                </div>
                <span class="text-body font-semibold text-foreground/80">{{ cat.name }}</span>
              </div>
              <div class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                    title="Editar"
                    aria-label="Editar categoria"
                    @click="startEdit(cat)"
                  >
                      <Edit2 class="h-4 w-4 text-primary" />
                  </button>
                  <button
                    v-if="cat.name.toLowerCase() !== 'outros'"
                    class="p-2 hover:bg-destructive/10 rounded-xl transition-all duration-200 text-muted-foreground hover:text-destructive shrink-0 hover:scale-105 active:scale-[0.97]"
                    title="Remover"
                    aria-label="Remover categoria"
                    @click="confirmDelete(cat.id)"
                  >
                      <Trash2 class="h-4 w-4" />
                  </button>
              </div>
          </template>
        </div>
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

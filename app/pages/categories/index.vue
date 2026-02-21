<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Trash2, Edit2, Check, X, Tags as TagsIcon, Plus, Wand2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Card } from '@/components/ui/card'
import ListSkeleton from '@/components/ui/ListSkeleton.vue'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import ColorPicker from '@/components/ui/ColorPicker.vue'

interface Category {
  id: string
  name: string
  color: string | null
  emoji: string | null
}

const { data: categories, refresh, status } = useFetch<Category[]>('/api/categories')
const categoriesCount = computed(() => categories.value?.length ?? 0)

const form = reactive({
  name: '',
  color: null as string | null,
  emoji: null as string | null,
})

const editingId = ref<string | null>(null)
const editingName = ref('')
const editingColor = ref<string | null>(null)
const editingEmoji = ref<string | null>(null)

async function onSubmit() {
  if (!form.name.trim()) return

  try {
    await $fetch('/api/categories', {
      method: 'POST',
      body: { name: form.name, color: form.color || undefined, emoji: form.emoji || undefined }
    })

    form.name = ''
    form.color = null
    form.emoji = null
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
  editingColor.value = cat.color
  editingEmoji.value = cat.emoji
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
  editingColor.value = null
  editingEmoji.value = null
}

async function saveEdit() {
  if (!editingId.value || !editingName.value.trim()) return

  try {
    await $fetch(`/api/categories/${editingId.value}`, {
      method: 'PUT',
      body: { name: editingName.value, color: editingColor.value, emoji: editingEmoji.value }
    })

    editingId.value = null
    editingName.value = ''
    editingColor.value = null
    editingEmoji.value = null
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

// Categorization Rules
interface CategorizationRuleItem {
  id: string
  pattern: string
  isRegex: boolean
  categoryId: string
  categoryName: string
  categoryColor: string | null
  categoryEmoji: string | null
}

const { data: rules, refresh: refreshRules } = useFetch<CategorizationRuleItem[]>('/api/categorization-rules')

const ruleForm = reactive({
  pattern: '',
  categoryId: '',
  isRegex: false,
})

async function addRule() {
  if (!ruleForm.pattern.trim() || !ruleForm.categoryId) return

  try {
    await $fetch('/api/categorization-rules', {
      method: 'POST',
      body: { pattern: ruleForm.pattern, categoryId: ruleForm.categoryId, isRegex: ruleForm.isRegex },
    })
    ruleForm.pattern = ''
    ruleForm.categoryId = ''
    ruleForm.isRegex = false
    await refreshRules()
    toast.success('Regra adicionada!')
  } catch {
    toast.error('Erro ao adicionar regra')
  }
}

async function deleteRule(id: string) {
  try {
    await $fetch(`/api/categorization-rules/${id}`, { method: 'DELETE' })
    await refreshRules()
    toast.success('Regra removida')
  } catch {
    toast.error('Erro ao remover regra')
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
              <form class="flex gap-3 items-end" @submit.prevent="onSubmit">
                <EmojiPicker v-model="form.emoji" />
                <ColorPicker v-model="form.color" />
                <div class="flex-grow space-y-2">
                  <label class="text-micro text-muted-foreground ml-1" for="name">Nome da Categoria</label>
                  <input
                    id="name"
                    v-model="form.name"
                    placeholder="Ex: Educação, Lazer, Saúde..."
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
          <div v-if="editingId === cat.id" class="flex-grow flex items-center gap-2">
              <EmojiPicker v-model="editingEmoji" />
              <ColorPicker v-model="editingColor" />
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
                <div
                  class="h-8 w-8 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-105 text-sm"
                  :style="cat.color ? { backgroundColor: cat.color + '25', borderColor: cat.color + '40' } : {}"
                  :class="!cat.color && 'bg-primary/15 border-primary/25 group-hover:bg-primary/20'"
                >
                  <span v-if="cat.emoji">{{ cat.emoji }}</span>
                  <TagsIcon v-else class="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:scale-105" />
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
  
        <div v-if="!categories?.length" class="flex items-center gap-2 p-6">
            <div class="w-6 h-6 rounded-xl bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0 select-none">Du</div>
            <p class="text-sm text-muted-foreground">Cria suas categorias pra organizar tudo!</p>
        </div>
      </Card>
    </template>
    
    <!-- Categorization Rules Section -->
    <div class="space-y-4 mt-8">
      <div class="flex items-center gap-2">
        <Wand2 class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Regras de Categorização Automática
        </h3>
      </div>

      <p class="text-xs text-muted-foreground">
        Defina padrões para categorizar transações automaticamente durante a importação.
      </p>

      <!-- Add Rule Form -->
      <Card class="p-4">
        <form class="flex flex-col sm:flex-row gap-3 items-end" @submit.prevent="addRule">
          <div class="flex-grow space-y-1.5">
            <label class="text-micro text-muted-foreground" for="rule-pattern">Padrão</label>
            <input
              id="rule-pattern"
              v-model="ruleForm.pattern"
              placeholder="Ex: UBER, IFOOD, NETFLIX..."
              class="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
              required
            >
          </div>
          <div class="w-full sm:w-48 space-y-1.5">
            <label class="text-micro text-muted-foreground">Categoria</label>
            <select
              v-model="ruleForm.categoryId"
              class="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
              required
            >
              <option value="" disabled>Selecionar...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.emoji ? cat.emoji + ' ' : '' }}{{ cat.name }}
              </option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-xs text-muted-foreground shrink-0 h-10">
            <input v-model="ruleForm.isRegex" type="checkbox" class="rounded border-border">
            Regex
          </label>
          <button
            type="submit"
            class="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shrink-0"
          >
            Adicionar
          </button>
        </form>
      </Card>

      <!-- Rules List -->
      <div v-if="rules && rules.length > 0" class="space-y-2">
        <Card
          v-for="rule in rules"
          :key="rule.id"
          class="p-3 flex items-center gap-3"
        >
          <code class="text-sm bg-muted/60 px-2 py-0.5 rounded-lg font-mono flex-1 truncate">
            {{ rule.pattern }}
          </code>
          <span v-if="rule.isRegex" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-info/10 text-info shrink-0">
            regex
          </span>
          <span class="text-xs text-muted-foreground shrink-0">→</span>
          <span class="flex items-center gap-1 text-sm shrink-0">
            <span v-if="rule.categoryEmoji">{{ rule.categoryEmoji }}</span>
            <span
              v-else-if="rule.categoryColor"
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: rule.categoryColor }"
            />
            {{ rule.categoryName }}
          </span>
          <button
            class="p-1.5 hover:bg-destructive/10 rounded-lg transition-all text-muted-foreground hover:text-destructive shrink-0"
            @click="deleteRule(rule.id)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </Card>
      </div>
      <div v-else class="flex items-center gap-2 py-4 px-1">
        <div class="w-6 h-6 rounded-xl bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0 select-none">Du</div>
        <p class="text-sm text-muted-foreground">Regras ajudam na importação. Quer criar uma? Use o formulário acima.</p>
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

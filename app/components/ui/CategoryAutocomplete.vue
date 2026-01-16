<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Check, ChevronsUpDown, Plus, Search, Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

const props = defineProps<{
  modelValue: string
  categories: Category[]
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = ref(false)
const searchQuery = ref('')
const isCreating = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const selectedCategory = computed(() => {
  return props.categories.find((cat) => cat.id === props.modelValue)
})

const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return props.categories
  return props.categories.filter((cat) =>
    cat.name.toLowerCase().includes(query)
  )
})

const showCreateOption = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return false
  return !props.categories.some(
    (cat) => cat.name.toLowerCase() === query.toLowerCase()
  )
})

async function createNewCategory() {
  const name = searchQuery.value.trim()
  if (!name || isCreating.value) return

  isCreating.value = true
  try {
    const newCat = await $fetch<Category>('/api/categories', {
      method: 'POST',
      body: { name }
    })
    
    emit('refresh')
    emit('update:modelValue', newCat.id)
    isOpen.value = false
    searchQuery.value = ''
  } catch (e) {
    console.error(e)
  } finally {
    isCreating.value = false
  }
}

function selectCategory(id: string) {
  emit('update:modelValue', id)
  isOpen.value = false
  searchQuery.value = ''
}

function toggleOpen() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        searchQuery.value = ''
    }
}

// Close on click outside
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Trigger -->
    <button
      type="button"
      @click="toggleOpen"
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span :class="!selectedCategory && 'text-muted-foreground'">
        {{ selectedCategory ? selectedCategory.name : "Selecionar categoria..." }}
      </span>
      <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100"
    >
      <!-- Search Input -->
      <div class="flex items-center border-b px-3">
        <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          v-model="searchQuery"
          class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Buscar ou criar..."
          @keyup.enter="showCreateOption && createNewCategory()"
          autoFocus
        />
      </div>

      <!-- List -->
      <div class="overflow-y-auto max-h-[200px] p-1">
        <div v-if="filteredCategories.length === 0 && !showCreateOption" class="py-6 text-center text-sm text-muted-foreground">
          Nenhuma encontrada.
        </div>
        
        <div v-for="cat in filteredCategories" :key="cat.id">
            <button
                type="button"
                @click="selectCategory(cat.id)"
                class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
                <Check
                    :class="cn(
                    'mr-2 h-4 w-4',
                    modelValue === cat.id ? 'opacity-100' : 'opacity-0'
                    )"
                />
                {{ cat.name }}
            </button>
        </div>

        <!-- Create Option -->
        <div v-if="showCreateOption" class="border-t mt-1 pt-1">
            <button
                type="button"
                @click="createNewCategory"
                class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium text-primary outline-none hover:bg-accent hover:text-accent-foreground"
                :disabled="isCreating"
            >
                <Plus v-if="!isCreating" class="mr-2 h-4 w-4" />
                <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
                Criar "{{ searchQuery }}"
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

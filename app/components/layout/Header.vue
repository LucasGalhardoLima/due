<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const routes = [
  { name: 'Dashboard', path: '/' },
  { name: 'Cartões', path: '/cards' },
  { name: 'Categorias', path: '/categories' },
  { name: 'Importar', path: '/import' },
  { name: 'Auditoria', path: '/admin/transactions' },
]

const isOpen = ref(false)
</script>

<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="font-bold text-xl flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          D
        </div>
        <span>Due</span>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-6">
        <NuxtLink 
          v-for="route in routes" 
          :key="route.path" 
          :to="route.path"
          class="text-sm font-medium transition-colors hover:text-primary"
          active-class="text-primary font-semibold"
        >
          {{ route.name }}
        </NuxtLink>
      </nav>

      <!-- Mobile Navigation -->
      <div class="md:hidden">
        <Sheet v-model:open="isOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden">
              <Menu class="h-6 w-6" />
              <span class="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-[300px] sm:w-[400px]">
            <SheetHeader class="text-left mb-6">
              <SheetTitle class="font-bold text-xl flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                    D
                </div>
                Due
              </SheetTitle>
            </SheetHeader>
            <nav class="flex flex-col gap-4">
              <NuxtLink 
                v-for="route in routes" 
                :key="route.path" 
                :to="route.path"
                class="block py-2 text-lg font-medium transition-colors hover:text-primary border-b border-border/40"
                active-class="text-primary font-semibold"
                @click="isOpen = false"
              >
                {{ route.name }}
              </NuxtLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>

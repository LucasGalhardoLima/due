<script setup lang="ts">
// Dashboard View

const { data: currentInvoice } = await useFetch('/api/dashboard/current-invoice')
const { data: futureProjection } = await useFetch('/api/dashboard/future-projection')
const { data: pareto } = await useFetch('/api/dashboard/pareto')

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function getMonthName(monthIndex: number) {
  // monthIndex is 1-based from API
  return months[monthIndex - 1]
}
</script>

<template>
  <div class="container mx-auto py-8 space-y-8">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <NuxtLink to="/cards" class="text-sm font-medium text-primary hover:underline">
        Gerenciar Cartões
      </NuxtLink>
    </div>

    <!-- KPI Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border bg-card text-card-foreground shadow">
        <div class="p-6 flex flex-col space-y-1">
          <span class="text-sm font-medium text-muted-foreground">Fatura Atual (Estimada)</span>
          <span class="text-2xl font-bold">{{ formatCurrency(currentInvoice?.total || 0) }}</span>
          <span class="text-xs text-muted-foreground">
            {{ getMonthName(currentInvoice?.month) }}/{{ currentInvoice?.year }}
          </span>
        </div>
      </div>
    </div>

    <!-- Future Projection -->
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="p-6 pb-4">
        <h3 class="text-lg font-semibold">Projeção Futura (Danos Contratados)</h3>
        <p class="text-sm text-muted-foreground">O que já está parcelado para os próximos meses.</p>
      </div>
      <div class="p-6 pt-0">
        <div class="grid gap-4 md:grid-cols-3">
          <div v-for="proj in futureProjection?.projections" :key="`${proj.month}-${proj.year}`" 
               class="flex flex-col p-4 rounded-lg bg-muted/50 border">
            <span class="text-sm font-medium text-muted-foreground uppercase">{{ getMonthName(proj.month) }}/{{ proj.year }}</span>
            <span class="text-xl font-bold mt-1">{{ formatCurrency(proj.total) }}</span>
            <span class="text-xs text-muted-foreground mt-1">{{ proj.installmentsCount }} parcelas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pareto Analysis -->
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="p-6 pb-4">
        <h3 class="text-lg font-semibold">Análise de Pareto</h3>
        <p class="text-sm text-muted-foreground">Onde seu dinheiro está indo (Top Categorias).</p>
      </div>
      <div class="p-6 pt-0 space-y-4">
        <div v-for="cat in pareto?.categories.slice(0, 5)" :key="cat.name" class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium">{{ cat.name }}</span>
            <span class="text-muted-foreground">{{ formatCurrency(cat.total) }} ({{ cat.percentage }}%)</span>
          </div>
          <div class="h-2 w-full rounded-full bg-secondary">
            <div class="h-2 rounded-full bg-primary" :style="{ width: `${cat.percentage}%` }"></div>
          </div>
        </div>
        <div v-if="!pareto?.categories?.length" class="text-sm text-muted-foreground py-4">
          Nenhuma despesa registrada ainda.
        </div>
      </div>
    </div>
    
    <!-- Quick Add Button (Floating or Inline) -->
    <!-- We will add functionality later, for now just a link/button placeholder -->
    <div class="fixed bottom-8 right-8">
      <NuxtLink to="/add-expense" class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </NuxtLink>
    </div>

  </div>
</template>

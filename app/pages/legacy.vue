<script setup lang="ts">
import LegacyDebtForm from '@/components/transaction/LegacyDebtForm.vue'
</script>

<template>
  <div class="container mx-auto max-w-md py-8">
    <h1 class="text-2xl font-bold mb-6">Importar Legado</h1>
    <LegacyDebtForm />
    
    <div class="mt-8 text-center">
        <NuxtLink to="/" class="text-sm text-primary hover:underline">Voltar para Dashboard</NuxtLink>
    </div>
  </div>
</template>

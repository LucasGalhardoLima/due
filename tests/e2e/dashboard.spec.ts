import { test, expect } from '@playwright/test';

test('Dashboard Load and Display', async ({ page }) => {
  await page.goto('/');
  
  // 1. Verify Header
  await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
  await expect(page.getByText('Fatura Atual (Estimada)')).toBeVisible();
  
  // 2. Verify Sections
  await expect(page.getByText('Projeção Futura (Danos Contratados)')).toBeVisible();
  await expect(page.getByText('Análise de Pareto')).toBeVisible();
  
  // 3. Verify Links
  await expect(page.getByRole('link', { name: 'Gerenciar Cartões' })).toBeVisible();
  
  // 4. Verify Quick Add Button exists
  await expect(page.locator('a[href="/add-expense"]')).toBeVisible();
});

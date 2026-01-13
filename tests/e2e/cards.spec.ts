import { test, expect } from '@playwright/test';

test('Card Management Flow', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto('/cards');
  
  // Debug
  const content = await page.content();
  console.log('Page Title:', await page.title());
  console.log('Page Content Preview:', content.substring(0, 500));
  
  // 1. Verify Page Title
  await expect(page.getByText('Adicionar Novo Cartão')).toBeVisible();

  // 2. Add New Card
  const cardName = 'Cartão de Teste E2E';
  await page.getByLabel('Nome do Cartão').fill(cardName);
  await page.getByLabel('Limite (R$)').fill('5000');
  await page.getByLabel('Dia Fechamento').fill('15');
  await page.getByLabel('Dia Vencimento').fill('25');
  
  // Handle alert and log it
  page.on('dialog', dialog => {
    console.log('DIALOG DETECTED:', dialog.message());
    dialog.accept();
  });
  
  // Click save
  console.log('Clicking Save...');
  await page.getByRole('button', { name: 'Salvar' }).click();
  
  // Wait a bit for refresh
  await page.waitForTimeout(1000);

  // 3. Verify Card in List
  await expect(page.getByText(cardName)).toBeVisible();
  await expect(page.getByText('R$ 5.000,00')).toBeVisible();
  await expect(page.getByText('Fecha dia 15 • Vence dia 25')).toBeVisible();

  // 4. Delete Card
  page.once('dialog', dialog => dialog.accept()); // Confirm delete
  
  // Filter button more precisely
  await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
});

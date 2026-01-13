import { test, expect } from '@playwright/test';

test('Onboarding Legacy Expense Flow', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  // 1. Navigate to Onboarding
  const response = await page.goto('/onboarding', { waitUntil: 'networkidle' });
  
  // Log response status
  console.log('Response status:', response?.status());
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/onboarding-debug.png', fullPage: true });
  
  // Log page content
  const content = await page.content();
  console.log('Page content length:', content.length);
  console.log('Page title:', await page.title());
  
  // Check if there's an error page
  const errorText = await page.locator('body').textContent();
  if (errorText?.includes('500') || errorText?.includes('Error')) {
    console.log('ERROR PAGE DETECTED:', errorText?.substring(0, 500));
  }

  // Verify title with longer timeout
  await expect(page.getByText('Carga Inicial (Legado)')).toBeVisible({ timeout: 10000 });
});

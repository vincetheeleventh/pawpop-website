import { test, expect } from '@playwright/test';

test.describe('Shtuu Questionnaire Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shtuu');
    await page.waitForLoadState('networkidle');
  });

  test('should load Shtuu studio page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText("Shtuu", { timeout: 10000 });
  });

  test('should display welcome dialogue', async ({ page }) => {
    // Check welcome message appears
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    
    // Check both options are present
    await expect(page.getByRole('button', { name: /dog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cat/i })).toBeVisible();
  });

  test('should respond to dog selection', async ({ page }) => {
    // Wait for welcome dialogue
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    
    // Click dog option
    await page.getByRole('button', { name: /dog/i }).click();
    
    // Check response appears
    await expect(page.getByText(/dogg/i)).toBeVisible({ timeout: 10000 });
    
    // Check upload zone appeared
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should respond to cat selection', async ({ page }) => {
    // Wait for welcome dialogue
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    
    // Click cat option
    await page.getByRole('button', { name: /cat/i }).click();
    
    // Check response
    await expect(page.getByText(/kitt/i)).toBeVisible({ timeout: 10000 });
  });

  test('should validate email format', async ({ page }) => {
    // Navigate to upload step
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /dog/i }).click();
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
    
    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    // Check HTML5 validation
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should accept valid email', async ({ page }) => {
    // Navigate to upload step
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /dog/i }).click();
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
    
    // Enter valid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test@example.com');
    
    // Check HTML5 validation
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(true);
  });

  test('should show upload tip', async ({ page }) => {
    // Navigate to upload step
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /dog/i }).click();
    
    // Check tip is visible
    await expect(page.getByText(/Tip:/i)).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload
    await page.goto('/shtuu');
    await page.waitForLoadState('networkidle');
    
    // Page should still load
    await expect(page.locator('h1')).toContainText("Shtuu", { timeout: 10000 });
    
    // Dialogue should be visible
    await expect(page.getByText(/Shtuu.*love.*art.*pets/i)).toBeVisible({ timeout: 10000 });
    
    // Buttons should be tappable
    await page.getByRole('button', { name: /dog/i }).click();
    await expect(page.getByText(/dogg/i)).toBeVisible({ timeout: 10000 });
  });
});

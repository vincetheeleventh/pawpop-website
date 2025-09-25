import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload Flow - Production Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should open upload modal and handle file uploads', async ({ page }) => {
    // Step 1: Open upload modal
    await page.click('[data-testid="upload-button"]');
    
    // Wait for modal to be visible
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Step 2: Upload pet mom photo (first step)
    const testImagePath = path.join(__dirname, '../fixtures/test-pet-mom.jpg');
    
    // Upload pet mom photo using the hidden file input
    await page.setInputFiles('input[type="file"][accept*="image"]', testImagePath);
    
    // Wait for file to be processed and preview to appear
    await expect(page.locator('img[alt="Uploaded pet mom photo"]')).toBeVisible({ timeout: 10000 });
    
    // Verify Next button becomes enabled
    await expect(page.locator('button:has-text("Next"):not([disabled])')).toBeVisible();
    
    // Click Next to go to pet photo step
    await page.click('button:has-text("Next")');

    // Step 3: Upload pet photo (second step)
    const petImagePath = path.join(__dirname, '../fixtures/test-pet.jpg');
    
    // Upload pet photo
    await page.setInputFiles('input[type="file"][accept*="image"]', petImagePath);
    
    // Wait for pet photo preview
    await expect(page.locator('img[alt="Uploaded pet photo"]')).toBeVisible({ timeout: 10000 });
    
    // Click Next to go to details step
    await page.click('button:has-text("Next")');

    // Step 4: Fill in customer details
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    
    // Verify the final submit button is enabled
    await expect(page.locator('[data-testid="generate-artwork"]:not([disabled])')).toBeVisible();
  });

  test('should handle basic modal interactions', async ({ page }) => {
    // Simple test to verify modal can be opened and closed
    await page.click('[data-testid="upload-button"]');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    
    // Close modal
    await page.click('button[aria-label="Close"]');
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible();
  });
});

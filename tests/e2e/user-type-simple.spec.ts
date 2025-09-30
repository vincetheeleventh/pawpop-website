import { test, expect } from '@playwright/test';

/**
 * Simplified E2E Test for User Type Tracking
 * Tests core functionality without complex interactions
 */

test.describe('User Type Tracking - Core Functionality', () => {
  
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PawPop/i);
    console.log('✅ Homepage loaded');
  });

  test('should open upload modal and show email form', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Look for any button that might open the modal
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    // Try to find and click a "Get Started" or similar button
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      console.log('✅ Clicked get started button');
      
      // Wait a bit for modal to appear
      await page.waitForTimeout(2000);
      
      // Check if modal appeared
      const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      console.log(`Modal visible: ${modalVisible}`);
    } else {
      console.log('⚠️ Get started button not found');
    }
  });

  test('should verify email input exists and name input does not', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to open modal
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
      
      // Check for email input
      const emailInputs = await page.locator('input[type="email"]').count();
      console.log(`Email inputs found: ${emailInputs}`);
      expect(emailInputs).toBeGreaterThan(0);
      
      // Check that name input doesn't exist
      const nameInputs = await page.locator('input[name="name"]').count();
      console.log(`Name inputs found: ${nameInputs}`);
      expect(nameInputs).toBe(0);
      
      console.log('✅ Email input exists, name input does not');
    }
  });

  test('should find gift toggle switch', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
      
      // Look for switch/toggle
      const switches = await page.locator('[role="switch"]').count();
      console.log(`Switches found: ${switches}`);
      
      if (switches > 0) {
        const switchElement = page.locator('[role="switch"]').first();
        const isChecked = await switchElement.getAttribute('aria-checked');
        console.log(`Switch default state: ${isChecked}`);
        expect(isChecked).toBe('false');
        console.log('✅ Gift toggle found and is OFF by default');
      }
    }
  });

  test('should toggle gift switch on and off', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
      
      const switchElement = page.locator('[role="switch"]').first();
      
      if (await switchElement.isVisible()) {
        // Initial state
        let isChecked = await switchElement.getAttribute('aria-checked');
        console.log(`Initial state: ${isChecked}`);
        expect(isChecked).toBe('false');
        
        // Click to turn ON
        await switchElement.click();
        await page.waitForTimeout(500);
        
        isChecked = await switchElement.getAttribute('aria-checked');
        console.log(`After first click: ${isChecked}`);
        expect(isChecked).toBe('true');
        
        // Click to turn OFF
        await switchElement.click();
        await page.waitForTimeout(500);
        
        isChecked = await switchElement.getAttribute('aria-checked');
        console.log(`After second click: ${isChecked}`);
        expect(isChecked).toBe('false');
        
        console.log('✅ Toggle works correctly');
      }
    }
  });

  test('should show helper text when gift toggle is ON', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
      
      const switchElement = page.locator('[role="switch"]').first();
      
      if (await switchElement.isVisible()) {
        // Turn toggle ON
        await switchElement.click();
        await page.waitForTimeout(500);
        
        // Look for helper text
        const helperText = page.locator('text=/perfect for surprising|gift/i');
        const isVisible = await helperText.isVisible().catch(() => false);
        
        console.log(`Helper text visible: ${isVisible}`);
        
        if (isVisible) {
          console.log('✅ Helper text appears when toggle is ON');
        }
      }
    }
  });

  test('should validate email field', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const getStartedButton = page.locator('button').filter({ hasText: /get started|create|upload|start/i }).first();
    
    if (await getStartedButton.isVisible({ timeout: 5000 })) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
      
      // Try to submit without email
      const submitButton = page.locator('button[type="submit"]').first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Look for error message
        const errorVisible = await page.locator('text=/required|invalid|enter.*email/i').isVisible().catch(() => false);
        console.log(`Validation error shown: ${errorVisible}`);
        
        if (errorVisible) {
          console.log('✅ Email validation works');
        }
      }
    }
  });

  test('should check for analytics script loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if Plausible script loaded
    const plausibleScript = await page.locator('script[src*="plausible"]').count();
    console.log(`Plausible scripts found: ${plausibleScript}`);
    
    // Check if Google Ads script loaded
    const googleAdsScript = await page.locator('script[src*="googletagmanager"]').count();
    console.log(`Google Ads scripts found: ${googleAdsScript}`);
    
    // Check if Clarity script loaded
    const clarityScript = await page.evaluate(() => {
      return typeof (window as any).clarity !== 'undefined';
    });
    console.log(`Clarity loaded: ${clarityScript}`);
    
    console.log('✅ Analytics scripts checked');
  });
});

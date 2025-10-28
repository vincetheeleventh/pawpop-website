import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Pop5Pack Complete User Flow', () => {
  const testEmail = 'test-pop5pack@pawpopart.com';
  const testPetImage = path.join(__dirname, '../../public/images/e2e testing/test-pet-1.jpg');

  test.beforeEach(async ({ page }) => {
    // Navigate to Pop5Pack landing page
    await page.goto('/pop5pack');
  });

  test('should display landing page with all sections', async ({ page }) => {
    // Check hero section
    await expect(page.getByRole('heading', { name: /Turn Your Pet Into/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Iconic Parodies/i })).toBeVisible();
    
    // Check CTA button
    const ctaButton = page.getByRole('button', { name: /Get My Free Proof Now/i });
    await expect(ctaButton).toBeVisible();
    
    // Check trust indicators
    await expect(page.getByText(/No credit card required/i)).toBeVisible();
    await expect(page.getByText(/Instant delivery/i)).toBeVisible();
    
    // Check parody styles section exists
    await expect(page.getByText(/Choose Your Style/i)).toBeVisible();
    
    // Check how it works section
    await expect(page.getByText(/How It Works/i)).toBeVisible();
  });

  test('should open modal when CTA clicked', async ({ page }) => {
    // Click main CTA
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    
    // Modal should be visible
    await expect(page.getByRole('heading', { name: /Choose Your Free Proof Style/i })).toBeVisible();
    
    // All 4 parody styles should be visible
    await expect(page.getByText('Wizarding World')).toBeVisible();
    await expect(page.getByText('Jaws')).toBeVisible();
    await expect(page.getByText('The Godfather')).toBeVisible();
    await expect(page.getByText('MJ Thriller')).toBeVisible();
  });

  test('should complete style selection step', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    
    // Select Wizarding World style
    await page.getByRole('button', { name: /Wizarding World/i }).click();
    
    // Should move to email step
    await expect(page.getByRole('heading', { name: /Enter Your Email/i })).toBeVisible();
    await expect(page.getByText(/Wizarding World Style Selected/i)).toBeVisible();
    
    // Should have email input
    const emailInput = page.getByPlaceholder(/your@email.com/i);
    await expect(emailInput).toBeVisible();
    
    // Should have continue button
    await expect(page.getByRole('button', { name: /Continue to Upload/i })).toBeVisible();
  });

  test('should validate email before proceeding', async ({ page }) => {
    // Open modal and select style
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    await page.getByRole('button', { name: /Wizarding World/i }).click();
    
    // Try to submit without email
    await page.getByRole('button', { name: /Continue to Upload/i }).click();
    
    // Should still be on email step (HTML5 validation)
    await expect(page.getByRole('heading', { name: /Enter Your Email/i })).toBeVisible();
    
    // Enter invalid email
    await page.getByPlaceholder(/your@email.com/i).fill('invalid-email');
    await page.getByRole('button', { name: /Continue to Upload/i }).click();
    
    // Should still be on email step
    await expect(page.getByRole('heading', { name: /Enter Your Email/i })).toBeVisible();
  });

  test('should proceed to upload step with valid email', async ({ page }) => {
    // Open modal and select style
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    await page.getByRole('button', { name: /Wizarding World/i }).click();
    
    // Enter valid email
    await page.getByPlaceholder(/your@email.com/i).fill(testEmail);
    await page.getByRole('button', { name: /Continue to Upload/i }).click();
    
    // Should move to upload step
    await expect(page.getByRole('heading', { name: /Upload Your Pet Photo/i })).toBeVisible();
    await expect(page.getByText(/No cropping or editing needed/i)).toBeVisible();
    
    // Should have upload button
    await expect(page.getByText(/Choose File/i)).toBeVisible();
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Open modal and select style
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    await page.getByRole('button', { name: /Wizarding World/i }).click();
    
    // Go back to style selection
    await page.getByRole('button', { name: /Change Style/i }).click();
    await expect(page.getByRole('heading', { name: /Choose Your Free Proof Style/i })).toBeVisible();
    
    // Select style again and proceed to upload
    await page.getByRole('button', { name: /Jaws/i }).click();
    await page.getByPlaceholder(/your@email.com/i).fill(testEmail);
    await page.getByRole('button', { name: /Continue to Upload/i }).click();
    
    // Go back to email step
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByRole('heading', { name: /Enter Your Email/i })).toBeVisible();
  });

  test('should close modal when X clicked', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    await expect(page.getByRole('heading', { name: /Choose Your Free Proof Style/i })).toBeVisible();
    
    // Click close button
    await page.getByRole('button', { name: /close/i }).first().click();
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: /Choose Your Free Proof Style/i })).not.toBeVisible();
  });

  test.skip('should upload photo and show generating state', async ({ page }) => {
    // This test is skipped because it requires actual file upload and API integration
    // We'll test the API separately
    
    // Open modal and complete steps
    await page.getByRole('button', { name: /Get My Free Proof Now/i }).click();
    await page.getByRole('button', { name: /Wizarding World/i }).click();
    await page.getByPlaceholder(/your@email.com/i).fill(testEmail);
    await page.getByRole('button', { name: /Continue to Upload/i }).click();
    
    // Upload file (this would require UploadThing to be working)
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(testPetImage);
    
    // Should show generating state
    // await expect(page.getByText(/Creating Your Proof/i)).toBeVisible();
    // await expect(page.getByText(/This usually takes 2-3 minutes/i)).toBeVisible();
  });

  test('should display parody styles section with all 4 styles', async ({ page }) => {
    // Scroll to parody styles section
    await page.evaluate(() => window.scrollTo(0, 800));
    
    // Wait for section to be visible
    await page.waitForTimeout(500);
    
    // Check all 4 parody cards are visible
    const wizardingCard = page.locator('text=Wizarding World').first();
    const jawsCard = page.locator('text=Jaws').first();
    const godfatherCard = page.locator('text=The Godfather').first();
    const thrillerCard = page.locator('text=MJ Thriller').first();
    
    await expect(wizardingCard).toBeVisible();
    await expect(jawsCard).toBeVisible();
    await expect(godfatherCard).toBeVisible();
    await expect(thrillerCard).toBeVisible();
  });

  test('should display how it works section with 4 steps', async ({ page }) => {
    // Scroll to how it works section
    await page.evaluate(() => window.scrollTo(0, 1600));
    
    // Wait for section to be visible
    await page.waitForTimeout(500);
    
    // Check for step indicators
    await expect(page.getByText(/Choose Your Style/i)).toBeVisible();
    await expect(page.getByText(/Upload Photo/i)).toBeVisible();
    await expect(page.getByText(/Get Free Proof/i)).toBeVisible();
    await expect(page.getByText(/Buy Full Pack/i)).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Pop 5-Pack.*Turn Your Pet into Iconic Parodies/i);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Get your pet transformed into 4 iconic parodies/i);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check hero is visible
    await expect(page.getByRole('heading', { name: /Turn Your Pet Into/i })).toBeVisible();
    
    // Check CTA button is visible and properly sized
    const ctaButton = page.getByRole('button', { name: /Get My Free Proof Now/i });
    await expect(ctaButton).toBeVisible();
    
    // Open modal on mobile
    await ctaButton.click();
    await expect(page.getByRole('heading', { name: /Choose Your Free Proof Style/i })).toBeVisible();
    
    // Check modal is properly sized for mobile
    const modal = page.locator('[class*="rounded-3xl"]').first();
    await expect(modal).toBeVisible();
  });
});

test.describe('Pop5Pack API Integration', () => {
  test('should have generate-proof API endpoint', async ({ request }) => {
    // Test that the endpoint exists (will return 400 without proper data)
    const response = await request.post('/api/pop5pack/generate-proof', {
      data: {}
    });
    
    // Should return 400 for missing fields, not 404
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('should validate required fields in generate-proof API', async ({ request }) => {
    // Test missing email
    let response = await request.post('/api/pop5pack/generate-proof', {
      data: {
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding'
      }
    });
    expect(response.status()).toBe(400);
    
    // Test missing petPhotoUrl
    response = await request.post('/api/pop5pack/generate-proof', {
      data: {
        email: 'test@example.com',
        parodyStyle: 'wizarding'
      }
    });
    expect(response.status()).toBe(400);
    
    // Test missing parodyStyle
    response = await request.post('/api/pop5pack/generate-proof', {
      data: {
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg'
      }
    });
    expect(response.status()).toBe(400);
  });

  test('should reject invalid parody styles', async ({ request }) => {
    const response = await request.post('/api/pop5pack/generate-proof', {
      data: {
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'invalid-style'
      }
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid parody style');
  });
});

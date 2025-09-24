import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Manual Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3002');
  });

  test('Complete manual approval workflow - user upload to admin approval', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full workflow
    
    // Step 1: User uploads images and triggers generation
    console.log('🎨 Step 1: Testing user upload and generation...');
    
    // Navigate to upload page
    await page.goto('http://localhost:3002/?upload=true');
    
    // Wait for upload modal to appear
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible({ timeout: 10000 });
    
    // Fill in customer details
    await page.fill('input[name="customerName"]', 'E2E Test User');
    await page.fill('input[name="customerEmail"]', 'pawpopart@gmail.com');
    await page.fill('input[name="petName"]', 'E2E Test Pet');
    
    // Upload pet mom photo
    const petMomPath = path.join(__dirname, '../../public/images/e2e testing/test-petmom.png');
    await page.setInputFiles('input[name="petMomPhoto"]', petMomPath);
    
    // Upload pet photo
    const petPath = path.join(__dirname, '../../public/images/e2e testing/test-pet.jpeg');
    await page.setInputFiles('input[name="petPhoto"]', petPath);
    
    // Start generation
    await page.click('button[type="submit"]');
    
    // Wait for generation to complete (this may take a while)
    await expect(page.locator('text=Generation complete')).toBeVisible({ timeout: 120000 });
    
    // Capture the artwork URL for later verification
    const artworkUrl = await page.url();
    console.log('✅ Artwork generated, URL:', artworkUrl);
    
    // Step 2: Verify admin review was created
    console.log('🔍 Step 2: Checking admin review creation...');
    
    // Navigate to admin reviews API to check if review was created
    const response = await page.request.get('http://localhost:3002/api/admin/reviews');
    const reviewsData = await response.json();
    
    expect(reviewsData.success).toBe(true);
    expect(reviewsData.reviews.length).toBeGreaterThan(0);
    
    const latestReview = reviewsData.reviews[reviewsData.reviews.length - 1];
    console.log('✅ Admin review found:', latestReview.review_id);
    
    // Step 3: Test admin dashboard access
    console.log('🖥️ Step 3: Testing admin dashboard...');
    
    await page.goto('http://localhost:3002/admin/reviews');
    
    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('Admin Reviews');
    
    // Verify the review appears in the dashboard
    await expect(page.locator(`text=${latestReview.customer_name}`)).toBeVisible();
    await expect(page.locator('text=artwork_proof')).toBeVisible();
    await expect(page.locator('text=pending')).toBeVisible();
    
    // Step 4: Test review approval process
    console.log('✅ Step 4: Testing review approval...');
    
    // Click on the review to open details
    await page.click(`text=${latestReview.customer_name}`);
    
    // Wait for review details page
    await expect(page.locator('h1')).toContainText('Review Details');
    
    // Verify review information is displayed
    await expect(page.locator('text=E2E Test User')).toBeVisible();
    await expect(page.locator('text=E2E Test Pet')).toBeVisible();
    await expect(page.locator('text=artwork_proof')).toBeVisible();
    
    // Add review notes
    await page.fill('textarea[name="notes"]', 'E2E test approval - artwork looks great!');
    
    // Approve the review
    await page.click('button:has-text("Approve")');
    
    // Wait for approval confirmation
    await expect(page.locator('text=approved successfully')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Review approved successfully');
    
    // Step 5: Verify approval effects
    console.log('📧 Step 5: Verifying approval effects...');
    
    // Check that review status changed
    await page.goto('http://localhost:3002/admin/reviews');
    await expect(page.locator('text=approved')).toBeVisible();
    
    // Verify API reflects the approval
    const updatedResponse = await page.request.get('http://localhost:3002/api/admin/reviews');
    const updatedData = await updatedResponse.json();
    const approvedReview = updatedData.reviews.find((r: any) => r.review_id === latestReview.review_id);
    
    expect(approvedReview.status).toBe('approved');
    expect(approvedReview.reviewed_by).toBe('test-admin@pawpopart.com');
    expect(approvedReview.review_notes).toContain('E2E test approval');
    
    console.log('✅ All approval effects verified');
    
    // Step 6: Test customer experience after approval
    console.log('🎯 Step 6: Testing customer experience...');
    
    // Navigate back to the artwork page (if we captured it)
    if (artworkUrl.includes('/artwork/')) {
      await page.goto(artworkUrl);
      
      // Verify artwork is accessible and shows approved status
      await expect(page.locator('img')).toBeVisible(); // Artwork image
      await expect(page.locator('text=Make it Real')).toBeVisible(); // CTA button
      
      console.log('✅ Customer artwork page accessible after approval');
    }
    
    console.log('🎉 Complete manual approval workflow test passed!');
  });

  test('Admin dashboard functionality', async ({ page }) => {
    console.log('🖥️ Testing admin dashboard functionality...');
    
    await page.goto('http://localhost:3002/admin/reviews');
    
    // Test dashboard loads
    await expect(page.locator('h1')).toContainText('Admin Reviews');
    
    // Test filtering options (if available)
    const filterButtons = page.locator('button:has-text("artwork_proof"), button:has-text("highres_file")');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      console.log('✅ Filter functionality working');
    }
    
    // Test refresh functionality
    await page.reload();
    await expect(page.locator('h1')).toContainText('Admin Reviews');
    
    console.log('✅ Admin dashboard functionality verified');
  });

  test('API endpoints accessibility', async ({ page }) => {
    console.log('🔌 Testing API endpoints...');
    
    // Test admin reviews API
    const reviewsResponse = await page.request.get('http://localhost:3002/api/admin/reviews');
    expect(reviewsResponse.ok()).toBe(true);
    
    const reviewsData = await reviewsResponse.json();
    expect(reviewsData.success).toBe(true);
    expect(Array.isArray(reviewsData.reviews)).toBe(true);
    
    console.log('✅ Admin reviews API working');
    
    // Test artwork creation API
    const createResponse = await page.request.post('http://localhost:3002/api/artwork/create', {
      data: {
        customer_name: 'API Test User',
        customer_email: 'test@example.com',
        pet_name: 'API Test Pet'
      }
    });
    
    expect(createResponse.ok()).toBe(true);
    const createData = await createResponse.json();
    expect(createData.id).toBeDefined();
    
    console.log('✅ Artwork creation API working');
    console.log('✅ All API endpoints accessible');
  });

  test('Error handling and edge cases', async ({ page }) => {
    console.log('⚠️ Testing error handling...');
    
    // Test invalid review ID
    const invalidResponse = await page.request.post('http://localhost:3002/api/admin/reviews/invalid-id/process', {
      data: {
        status: 'approved',
        reviewedBy: 'test@example.com',
        notes: 'Test'
      }
    });
    
    expect(invalidResponse.status()).toBe(404);
    
    // Test invalid status
    const invalidStatusResponse = await page.request.post('http://localhost:3002/api/admin/reviews/123e4567-e89b-12d3-a456-426614174000/process', {
      data: {
        status: 'invalid',
        reviewedBy: 'test@example.com'
      }
    });
    
    expect(invalidStatusResponse.status()).toBe(400);
    
    console.log('✅ Error handling working correctly');
  });
});

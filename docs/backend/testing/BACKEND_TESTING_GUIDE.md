# Backend Testing Guide for PawPop

This guide covers best practices for testing your PawPop backend without affecting production data or services.

## Testing Strategy Overview

### 1. Test Environment Isolation
**Never test against production!** Use isolated environments:

- **Unit Tests**: Mock all external dependencies
- **Integration Tests**: Use test database + mock external APIs
- **E2E Tests**: Use test database + real frontend, mock external APIs

### 2. Database Testing Approaches

#### Option A: Supabase Test Project (Recommended)
Create a separate Supabase project for testing:

```bash
# 1. Create new Supabase project at https://supabase.com
# 2. Name it "pawpop-test" or similar
# 3. Apply your schema to the test project
```

**Pros:**
- Complete isolation from production
- Real database behavior
- Safe for destructive tests

**Cons:**
- Additional Supabase project cost
- Need to maintain schema sync

#### Option B: Local Supabase (Advanced)
Run Supabase locally with Docker:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase init
supabase start

# Your local instance runs at http://localhost:54321
```

#### Option C: Test Database with Cleanup
Use your existing Supabase project with careful test isolation:

```typescript
// tests/helpers/database.ts
import { supabaseAdmin } from '@/lib/supabase';

export async function cleanupTestData() {
  // Delete test data by email pattern
  await supabaseAdmin
    .from('artworks')
    .delete()
    .like('customer_email', '%@test.example');
    
  await supabaseAdmin
    .from('orders')
    .delete()
    .like('customer_email', '%@test.example');
}

export async function createTestData() {
  // Create known test data
  const { data: artwork } = await supabaseAdmin
    .from('artworks')
    .insert({
      customer_email: 'test@test.example',
      customer_name: 'Test User',
      generation_status: 'completed'
    })
    .select()
    .single();
    
  return { artwork };
}
```

## Environment Configuration

### Test Environment Variables

Create environment-specific configs:

```bash
# .env.test - for integration/E2E tests
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Mock external APIs
FAL_API_KEY=mock_fal_key
STRIPE_SECRET_KEY=sk_test_mock
PRINTIFY_API_TOKEN=mock_printify_token
```

```bash
# .env.test.local - for unit tests (all mocked)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock_key
SUPABASE_SERVICE_ROLE_KEY=mock_key
```

## Testing Types and Setup

### 1. Unit Tests (Vitest)
Test individual functions with mocked dependencies:

```typescript
// tests/unit/supabase-artworks.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createArtwork } from '@/lib/supabase-artworks';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-id', customer_email: 'test@example.com' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('createArtwork', () => {
  it('should create artwork with valid data', async () => {
    const result = await createArtwork({
      customer_email: 'test@example.com',
      customer_name: 'Test User'
    });
    
    expect(result.data?.id).toBe('test-id');
  });
});
```

### 2. Integration Tests (Vitest)
Test API routes with real database, mocked external APIs:

```typescript
// tests/integration/artwork-api.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/artwork/create/route';
import { cleanupTestData, createTestData } from '../helpers/database';

describe('/api/artwork/create', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });

  it('should create artwork successfully', async () => {
    const request = new Request('http://localhost:3000/api/artwork/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_email: 'test@test.example',
        customer_name: 'Test User',
        pet_mom_url: 'https://example.com/mom.jpg',
        pet_url: 'https://example.com/pet.jpg'
      })
    });

    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.artwork.customer_email).toBe('test@test.example');
  });
});
```

### 3. E2E Tests (Playwright)
Test complete user flows with real frontend + backend:

```typescript
// tests/e2e/artwork-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Artwork Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock external API calls
    await page.route('/api/monalisa-complete', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
        body: Buffer.from('fake-image-data')
      });
    });
  });

  test('should create artwork end-to-end', async ({ page }) => {
    await page.goto('/');
    
    // Upload photos
    await page.click('button:has-text("Upload Photo Now")');
    // ... rest of test flow
    
    // Verify database state
    // Note: Use test email patterns for easy cleanup
    await page.fill('input[placeholder="Enter your email"]', 'e2e-test@test.example');
  });
});
```

## API Mocking Strategies

### Mock External APIs in Tests

```typescript
// tests/helpers/api-mocks.ts
export const mockFalAI = (page: Page) => {
  return page.route('**/fal.ai/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        image_url: 'https://test.fal.media/generated.jpg',
        request_id: 'test-123'
      })
    });
  });
};

export const mockStripeWebhook = (page: Page) => {
  return page.route('/api/webhook', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ received: true })
    });
  });
};
```

## Database Schema Management

### Keep Test Schema in Sync

```sql
-- tests/fixtures/test-schema.sql
-- Copy of your production schema for test database setup

CREATE TABLE IF NOT EXISTS artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  generation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add test-specific indexes
CREATE INDEX IF NOT EXISTS idx_artworks_test_email 
ON artworks(customer_email) 
WHERE customer_email LIKE '%@test.example';
```

### Test Data Factories

```typescript
// tests/factories/artwork.ts
export const createTestArtwork = (overrides = {}) => ({
  customer_email: 'test@test.example',
  customer_name: 'Test User',
  generation_status: 'pending',
  pet_mom_url: 'https://test.example.com/mom.jpg',
  pet_url: 'https://test.example.com/pet.jpg',
  ...overrides
});

export const createTestOrder = (artworkId: string, overrides = {}) => ({
  artwork_id: artworkId,
  customer_email: 'test@test.example',
  product_type: 'digital',
  price_cents: 2999,
  order_status: 'pending',
  ...overrides
});
```

## Running Tests

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### Test Execution Order

```bash
# 1. Unit tests (fastest, no external dependencies)
npm run test:unit

# 2. Integration tests (medium speed, test database)
npm run test:integration

# 3. E2E tests (slowest, full application)
npm run test:e2e
```

## CI/CD Testing

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Setup test database
        env:
          SUPABASE_TEST_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
        run: npm run test:integration
        
      - name: Install Playwright
        run: npx playwright install
        
      - name: Run E2E tests
        env:
          SUPABASE_TEST_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
        run: npm run test:e2e
```

## Best Practices Summary

### ✅ Do
- Use separate test database/project
- Mock external APIs (Stripe, FAL.ai, Printify)
- Use test-specific email patterns for easy cleanup
- Run tests in isolation (unit → integration → E2E)
- Clean up test data after each test
- Use factories for consistent test data

### ❌ Don't
- Test against production database
- Use real API keys for external services in tests
- Leave test data in database after tests
- Run destructive tests without isolation
- Skip test cleanup in CI/CD

### Test Data Patterns
- Emails: `test@test.example`, `e2e-test@test.example`
- Names: `Test User`, `E2E Test User`
- URLs: `https://test.example.com/image.jpg`

This approach ensures your tests are reliable, isolated, and won't interfere with production data or cost you money on external API calls.

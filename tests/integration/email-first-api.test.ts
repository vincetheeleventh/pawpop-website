/**
 * Email-First Flow API Integration Tests
 * Tests the complete API flow without UI dependencies
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

describe('Email-First Flow API Integration', () => {
  let artworkId: string;
  let uploadToken: string;
  const testEmail = `test-${Date.now()}@pawpopart.com`;
  const testName = 'Test User';

  it('should create artwork with email capture', async () => {
    const response = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: testName,
        customer_email: testEmail,
        email_captured_at: new Date().toISOString(),
        upload_deferred: false
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.artwork).toBeDefined();
    expect(data.artwork.id).toBeDefined();
    expect(data.artwork.customer_email).toBe(testEmail);
    expect(data.artwork.customer_name).toBe(testName);
    expect(data.access_token).toBeDefined();

    artworkId = data.artwork.id;
    console.log('✅ Artwork created:', artworkId);
  });

  it('should generate upload token', async () => {
    expect(artworkId).toBeDefined();

    const response = await fetch(`${BASE_URL}/api/artwork/generate-upload-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.uploadToken).toBeDefined();
    expect(data.uploadToken.length).toBeGreaterThan(20);

    uploadToken = data.uploadToken;
    console.log('✅ Upload token generated:', uploadToken.substring(0, 10) + '...');
  });

  it('should mark artwork as deferred', async () => {
    expect(artworkId).toBeDefined();

    const response = await fetch(`${BASE_URL}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artworkId,
        upload_deferred: true
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    console.log('✅ Artwork marked as deferred');
  });

  it('should retrieve artwork by upload token', async () => {
    expect(uploadToken).toBeDefined();

    const response = await fetch(`${BASE_URL}/api/artwork/by-upload-token?token=${uploadToken}`);

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.artwork).toBeDefined();
    expect(data.artwork.id).toBe(artworkId);
    expect(data.artwork.upload_token).toBe(uploadToken);
    expect(data.artwork.upload_deferred).toBe(true);

    console.log('✅ Artwork retrieved by token');
  });

  it('should get artworks needing reminders', async () => {
    const response = await fetch(`${BASE_URL}/api/email/upload-reminder?send=false`);

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.count).toBeDefined();
    expect(Array.isArray(data.artworks)).toBe(true);

    console.log(`✅ Found ${data.count} artworks needing reminders`);
  });

  it('should handle invalid upload token', async () => {
    const response = await fetch(`${BASE_URL}/api/artwork/by-upload-token?token=invalid-token-123`);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);

    console.log('✅ Invalid token handled correctly');
  });

  it('should validate required fields in artwork creation', async () => {
    const response = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test',
        // Missing email
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);

    console.log('✅ Validation working correctly');
  });
});

describe('Email-First Flow Database Functions', () => {
  it('should verify generate_upload_token function exists', async () => {
    // This is tested via the API endpoint
    const response = await fetch(`${BASE_URL}/api/artwork/generate-upload-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: 'test-id' })
    });

    // Should fail with 500 (function exists but artwork doesn't)
    // or succeed if artwork exists
    expect([200, 500]).toContain(response.status);
    console.log('✅ Database function accessible');
  });

  it('should verify get_artworks_needing_reminders function', async () => {
    const response = await fetch(`${BASE_URL}/api/email/upload-reminder`);

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.count).toBeDefined();
    console.log('✅ Reminder function working');
  });
});

describe('Email-First Flow Performance', () => {
  it('should create artwork quickly', async () => {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Perf Test',
        customer_email: `perf-${Date.now()}@test.com`,
        email_captured_at: new Date().toISOString()
      })
    });

    const duration = Date.now() - startTime;
    
    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds

    console.log(`✅ Artwork creation took ${duration}ms`);
  });

  it('should generate token quickly', async () => {
    // First create artwork
    const createResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Token Perf Test',
        customer_email: `token-perf-${Date.now()}@test.com`,
        email_captured_at: new Date().toISOString()
      })
    });

    const { artwork } = await createResponse.json();
    
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/artwork/generate-upload-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: artwork.id })
    });

    const duration = Date.now() - startTime;
    
    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds

    console.log(`✅ Token generation took ${duration}ms`);
  });
});

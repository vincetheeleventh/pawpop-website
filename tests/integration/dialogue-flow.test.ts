/**
 * Integration Test: Complete Dialogue Flow
 * Tests the full dialogue session from start to upload
 */

import { describe, it, expect } from 'vitest';

describe('Complete Dialogue Flow', () => {
  it('should complete dialogue from start to upload step', async () => {
    // Step 1: Start session
    const startResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'test' })
    });

    expect(startResponse.status).toBe(200);
    const startData = await startResponse.json();
    expect(startData.success).toBe(true);
    expect(startData.sessionToken).toBeDefined();

    const sessionToken = startData.sessionToken;

    // Step 2: Select pet type
    const respondResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        step: 'welcome',
        response: { petType: 'dog' }
      })
    });

    expect(respondResponse.status).toBe(200);
    const respondData = await respondResponse.json();
    expect(respondData.success).toBe(true);
    expect(respondData.currentStep).toBe('upload');
    expect(respondData.dialogue.mood).toBe('happy');

    // Verify dialogue state progression
    expect(startData.currentStep).toBe('welcome');
    expect(respondData.currentStep).toBe('upload');
  });

  it('should maintain conversation state through steps', async () => {
    // Start session
    const startResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'integration_test' })
    });

    const startData = await startResponse.json();
    const sessionToken = startData.sessionToken;

    // Make selection
    const respondResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        step: 'welcome',
        response: { petType: 'cat' }
      })
    });

    const respondData = await respondResponse.json();

    // Verify continuity
    expect(respondData.sessionToken).toBe(sessionToken);
    expect(respondData.dialogue.message).toContain('kitt');
  });

  it('should generate unique session tokens', async () => {
    const tokens = new Set();

    for (let i = 0; i < 5; i++) {
      const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null, source: 'uniqueness_test' })
      });

      const data = await response.json();
      tokens.add(data.sessionToken);
    }

    expect(tokens.size).toBe(5);
  });

  it('should handle rapid consecutive requests', async () => {
    const sessionToken = 'test_token_' + Date.now();

    const requests = Array.from({ length: 3 }, () =>
      fetch('http://localhost:3000/api/shtuu/dialogue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null, source: 'concurrent_test' })
      })
    );

    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.status === 200);

    expect(allSuccessful).toBe(true);
  });
});

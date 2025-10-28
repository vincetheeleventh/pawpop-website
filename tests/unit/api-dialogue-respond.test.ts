/**
 * Unit Test: /api/shtuu/dialogue/respond
 * Tests the dialogue response handling endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('/api/shtuu/dialogue/respond', () => {
  let sessionToken: string;

  beforeAll(async () => {
    // Create a session first
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'test' })
    });
    const data = await response.json();
    sessionToken = data.sessionToken;
  });

  it('should respond to dog selection', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        step: 'welcome',
        response: { petType: 'dog' }
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.currentStep).toBe('upload');
    expect(data.dialogue.message).toContain('dogg');
  });

  it('should respond to cat selection', async () => {
    // Create new session for this test
    const startResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'test' })
    });
    const startData = await startResponse.json();

    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: startData.sessionToken,
        step: 'welcome',
        response: { petType: 'cat' }
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.dialogue.message).toContain('kitt');
  });

  it('should change mood to happy after selection', async () => {
    const startResponse = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'test' })
    });
    const startData = await startResponse.json();

    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: startData.sessionToken,
        step: 'welcome',
        response: { petType: 'dog' }
      })
    });

    const data = await response.json();

    expect(data.dialogue.mood).toBe('happy');
  });

  it('should return 400 for missing fields', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: 'test'
      })
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for invalid session token', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: 'invalid_token',
        step: 'welcome',
        response: { petType: 'dog' }
      })
    });

    expect(response.status).toBe(404);
  });
});

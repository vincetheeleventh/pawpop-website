/**
 * Unit Test: /api/shtuu/dialogue/start
 * Tests the dialogue session initialization endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('/api/shtuu/dialogue/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return welcome dialogue with session token', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'landing_page' })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionToken).toBeDefined();
    expect(data.sessionToken).toMatch(/^sess_/);
    expect(data.currentStep).toBe('welcome');
  });

  it('should return dialogue with correct structure', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'landing_page' })
    });

    const data = await response.json();

    expect(data.dialogue).toBeDefined();
    expect(data.dialogue.character).toBe('shtuu');
    expect(data.dialogue.message).toContain('Shtuu');
    expect(data.dialogue.options).toHaveLength(2);
    expect(data.dialogue.mood).toBe('idle');
  });

  it('should include dog and cat options', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'landing_page' })
    });

    const data = await response.json();

    const options = data.dialogue.options;
    expect(options.find((o: any) => o.id === 'dog')).toBeDefined();
    expect(options.find((o: any) => o.id === 'cat')).toBeDefined();
  });

  it('should handle missing body gracefully', async () => {
    const response = await fetch('http://localhost:3000/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    // Should still work with optional fields
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

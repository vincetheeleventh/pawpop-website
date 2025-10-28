import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/pop5pack/generate-proof/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-artwork-id',
              customer_email: 'test@example.com',
              generation_step: 'pending',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
}));

// Mock fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: vi.fn(() => Promise.resolve({
      data: {
        images: [
          {
            url: 'https://fal.ai/files/test-image.jpg',
            width: 1024,
            height: 1024,
          },
        ],
      },
    })),
  },
}));

// Mock email function
vi.mock('@/lib/email', () => ({
  sendPop5PackProofEmail: vi.fn(() => Promise.resolve({
    success: true,
    messageId: 'test-message-id',
  })),
}));

describe('POST /api/pop5pack/generate-proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if petPhotoUrl is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        parodyStyle: 'wizarding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if parodyStyle is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if parodyStyle is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'invalid-style',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid parody style');
  });

  it('should accept valid parody styles', async () => {
    const validStyles = ['wizarding', 'jaws', 'godfather', 'thriller'];

    for (const style of validStyles) {
      const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          petPhotoUrl: 'https://example.com/pet.jpg',
          parodyStyle: style,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.artworkId).toBe('test-artwork-id');
      expect(data.message).toContain('Proof generation started');
    }
  });

  it('should create artwork record in database', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const mockSupabase = createClient('', '');

    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding',
      }),
    });

    await POST(request);

    expect(mockSupabase.from).toHaveBeenCalledWith('artworks');
  });

  it('should return success response with artwork ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      artworkId: 'test-artwork-id',
      message: 'Proof generation started. Check your email in 2-3 minutes!',
    });
  });

  it('should handle database errors gracefully', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Mock database error
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create artwork record');
  });
});

describe('Parody Style Prompts', () => {
  it('should have prompts for all 4 parody styles', async () => {
    // This tests that the prompts are defined
    const styles = ['wizarding', 'jaws', 'godfather', 'thriller'];
    
    for (const style of styles) {
      const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          petPhotoUrl: 'https://example.com/pet.jpg',
          parodyStyle: style,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });
});

describe('Background Generation', () => {
  it('should start background generation without blocking response', async () => {
    const startTime = Date.now();

    const request = new NextRequest('http://localhost:3000/api/pop5pack/generate-proof', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        petPhotoUrl: 'https://example.com/pet.jpg',
        parodyStyle: 'wizarding',
      }),
    });

    const response = await POST(request);
    const endTime = Date.now();

    // Response should be fast (< 1 second) because generation is in background
    expect(endTime - startTime).toBeLessThan(1000);
    expect(response.status).toBe(200);
  });
});

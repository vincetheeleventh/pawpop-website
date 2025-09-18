import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/monalisa-maker/route';

// Mock dependencies
vi.mock('@ai-sdk/openai');
vi.mock('../../src/lib/supabase-storage', () => ({
  storeFalImageInSupabase: vi.fn()
}));

// Mock fal client
const mockFalClient = {
  stream: vi.fn(),
  storage: {
    upload: vi.fn()
  }
};

vi.mock('fal-ai', () => ({
  default: mockFalClient
}));

describe('MonaLisa Maker Storage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store generated image in Supabase Storage', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/generated-image.jpg' }],
      requestId: 'test-request-123'
    });

    // Mock Supabase storage
    const { storeFalImageInSupabase } = await import('../../src/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockResolvedValue('https://supabase.co/storage/artwork-123/monalisa_base_456.jpg');

    // Create test request with JSON body
    const requestBody = {
      artworkId: '123',
      imageUrl: 'https://example.com/test-image.jpg'
    };

    const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBe('https://supabase.co/storage/artwork-123/monalisa_base_456.jpg');
    expect(data.falImageUrl).toBe('https://fal.ai/generated-image.jpg');
    expect(storeFalImageInSupabase).toHaveBeenCalledWith(
      'https://fal.ai/generated-image.jpg',
      '123',
      'monalisa_base'
    );
  });

  it('should fallback to fal.ai URL if Supabase storage fails', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/generated-image.jpg' }],
      requestId: 'test-request-123'
    });

    // Mock Supabase storage failure
    const { storeFalImageInSupabase } = await import('../../src/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockRejectedValue(new Error('Storage quota exceeded'));

    const requestBody = {
      artworkId: '123',
      imageUrl: 'https://example.com/test-image.jpg'
    };

    const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBe('https://fal.ai/generated-image.jpg');
    expect(data.falImageUrl).toBe('https://fal.ai/generated-image.jpg');
  });

  it('should handle missing artwork ID gracefully', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/generated-image.jpg' }],
      requestId: 'test-request-123'
    });

    // Mock Supabase storage
    const { storeFalImageInSupabase } = await import('../../src/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockResolvedValue('https://supabase.co/storage/unknown/monalisa_base_456.jpg');

    const requestBody = {
      imageUrl: 'https://example.com/test-image.jpg'
    };

    const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(storeFalImageInSupabase).toHaveBeenCalledWith(
      'https://fal.ai/generated-image.jpg',
      'unknown',
      'monalisa_base'
    );
  });
});

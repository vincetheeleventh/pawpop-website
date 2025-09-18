import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pet-integration/route';

// Mock dependencies
vi.mock('@/lib/supabase-storage', () => ({
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

describe('Pet Integration Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store pet integration result in Supabase Storage with FormData', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/pet-integration-result.jpg' }],
      requestId: 'pet-request-123'
    });

    // Mock Supabase storage
    const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockResolvedValue('https://supabase.co/storage/artwork-456/artwork_final_789.jpg');

    // Create test FormData request
    const formData = new FormData();
    formData.append('artworkId', '456');
    formData.append('portrait', new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' }));
    formData.append('pet', new File(['pet'], 'pet.jpg', { type: 'image/jpeg' }));

    const request = new NextRequest('http://localhost:3000/api/pet-integration', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBe('https://supabase.co/storage/artwork-456/artwork_final_789.jpg');
    expect(data.falImageUrl).toBe('https://fal.ai/pet-integration-result.jpg');
    expect(data.requestId).toBe('pet-request-123');
    expect(storeFalImageInSupabase).toHaveBeenCalledWith(
      'https://fal.ai/pet-integration-result.jpg',
      '456',
      'artwork_final'
    );
  });

  it('should store pet integration result with JSON request', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/pet-integration-result.jpg' }],
      requestId: 'pet-request-456'
    });

    // Mock Supabase storage
    const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockResolvedValue('https://supabase.co/storage/artwork-789/artwork_final_123.jpg');

    const requestBody = {
      artworkId: '789',
      portraitUrl: 'https://example.com/portrait.jpg',
      petUrl: 'https://example.com/pet.jpg'
    };

    const request = new NextRequest('http://localhost:3000/api/pet-integration', {
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
    expect(data.imageUrl).toBe('https://supabase.co/storage/artwork-789/artwork_final_123.jpg');
    expect(data.falImageUrl).toBe('https://fal.ai/pet-integration-result.jpg');
    expect(storeFalImageInSupabase).toHaveBeenCalledWith(
      'https://fal.ai/pet-integration-result.jpg',
      '789',
      'artwork_final'
    );
  });

  it('should fallback to fal.ai URL if Supabase storage fails', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/pet-integration-result.jpg' }],
      requestId: 'pet-request-789'
    });

    // Mock Supabase storage failure
    const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockRejectedValue(new Error('Network timeout'));

    const formData = new FormData();
    formData.append('artworkId', '123');
    formData.append('portrait', new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' }));
    formData.append('pet', new File(['pet'], 'pet.jpg', { type: 'image/jpeg' }));

    const request = new NextRequest('http://localhost:3000/api/pet-integration', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBe('https://fal.ai/pet-integration-result.jpg');
    expect(data.falImageUrl).toBe('https://fal.ai/pet-integration-result.jpg');
  });

  it('should handle missing artwork ID with default value', async () => {
    // Mock fal.ai response
    mockFalClient.stream.mockResolvedValue({
      images: [{ url: 'https://fal.ai/pet-integration-result.jpg' }],
      requestId: 'pet-request-default'
    });

    // Mock Supabase storage
    const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
    (storeFalImageInSupabase as any).mockResolvedValue('https://supabase.co/storage/unknown/artwork_final_123.jpg');

    const formData = new FormData();
    formData.append('portrait', new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' }));
    formData.append('pet', new File(['pet'], 'pet.jpg', { type: 'image/jpeg' }));

    const request = new NextRequest('http://localhost:3000/api/pet-integration', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(storeFalImageInSupabase).toHaveBeenCalledWith(
      'https://fal.ai/pet-integration-result.jpg',
      'unknown',
      'artwork_final'
    );
  });
});

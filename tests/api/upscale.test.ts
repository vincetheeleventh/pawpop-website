import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '@/app/api/upscale/route';
import { NextRequest } from 'next/server';
import * as supabaseArtworks from '@/lib/supabase-artworks';
import { fal } from '@fal-ai/client';

// Mock dependencies
vi.mock('@fal-ai/client');
vi.mock('@/lib/supabase-artworks');

const mockFal = vi.mocked(fal);
const mockSupabaseArtworks = vi.mocked(supabaseArtworks);

describe('/api/upscale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fal.config
    mockFal.config = vi.fn();
    
    // Mock environment variables
    process.env.FAL_KEY = 'test-fal-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/upscale', () => {
    const mockArtwork = {
      id: 'artwork-123',
      generated_image_url: 'https://example.com/artwork.jpg',
      upscale_status: 'pending' as const,
      upscaled_image_url: null,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      original_image_url: 'https://example.com/original.jpg',
      generation_status: 'completed' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should successfully upscale an artwork', async () => {
      // Mock Supabase functions
      mockSupabaseArtworks.getArtworkById.mockResolvedValue(mockArtwork);
      mockSupabaseArtworks.updateArtworkUpscaleStatus.mockResolvedValue({
        ...mockArtwork,
        upscale_status: 'completed',
        upscaled_image_url: 'https://example.com/upscaled.jpg'
      });

      // Mock fal.subscribe
      const mockUpscaleResult = {
        data: {
          image: {
            url: 'https://example.com/upscaled.jpg'
          }
        },
        requestId: 'fal-request-123'
      };
      mockFal.subscribe = vi.fn().mockResolvedValue(mockUpscaleResult);

      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({ artworkId: 'artwork-123' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.upscaled_image_url).toBe('https://example.com/upscaled.jpg');
      expect(result.request_id).toBe('fal-request-123');

      // Verify fal.subscribe was called with correct parameters
      expect(mockFal.subscribe).toHaveBeenCalledWith('fal-ai/clarity-upscaler', {
        input: {
          image_url: 'https://example.com/artwork.jpg',
          prompt: 'masterpiece, best quality, highres, visible paintstroke texture, oil painting style',
          upscale_factor: 3,
          negative_prompt: '(worst quality, low quality, normal quality:2), blurry, pixelated, artifacts',
          creativity: 0.35,
          resemblance: 0.8,
          guidance_scale: 4,
          num_inference_steps: 18,
          enable_safety_checker: true
        },
        logs: true,
        onQueueUpdate: expect.any(Function)
      });

      // Verify database updates
      expect(mockSupabaseArtworks.updateArtworkUpscaleStatus).toHaveBeenCalledWith('artwork-123', 'processing');
      expect(mockSupabaseArtworks.updateArtworkUpscaleStatus).toHaveBeenCalledWith('artwork-123', 'completed', 'https://example.com/upscaled.jpg');
    });

    it('should return existing upscaled image if already completed', async () => {
      const completedArtwork = {
        ...mockArtwork,
        upscale_status: 'completed' as const,
        upscaled_image_url: 'https://example.com/existing-upscaled.jpg'
      };

      mockSupabaseArtworks.getArtworkById.mockResolvedValue(completedArtwork);

      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({ artworkId: 'artwork-123' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.upscaled_image_url).toBe('https://example.com/existing-upscaled.jpg');
      expect(result.message).toBe('Already upscaled');

      // Should not call fal.subscribe if already completed
      expect(mockFal.subscribe).not.toHaveBeenCalled();
    });

    it('should return 400 if artworkId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Artwork ID is required');
    });

    it('should return 404 if artwork not found', async () => {
      mockSupabaseArtworks.getArtworkById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({ artworkId: 'nonexistent' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Artwork not found');
    });

    it('should return 400 if no generated image to upscale', async () => {
      const artworkWithoutImage = {
        ...mockArtwork,
        generated_image_url: null
      };

      mockSupabaseArtworks.getArtworkById.mockResolvedValue(artworkWithoutImage);

      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({ artworkId: 'artwork-123' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('No generated image to upscale');
    });

    it('should handle fal.ai upscaling failure', async () => {
      mockSupabaseArtworks.getArtworkById.mockResolvedValue(mockArtwork);
      mockSupabaseArtworks.updateArtworkUpscaleStatus.mockResolvedValue(mockArtwork);

      // Mock fal.subscribe to throw an error
      mockFal.subscribe = vi.fn().mockRejectedValue(new Error('FAL.ai service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/upscale', {
        method: 'POST',
        body: JSON.stringify({ artworkId: 'artwork-123' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Upscaling failed');
      expect(result.details).toBe('FAL.ai service unavailable');

      // Should update status to failed
      expect(mockSupabaseArtworks.updateArtworkUpscaleStatus).toHaveBeenCalledWith('artwork-123', 'failed');
    });
  });

  describe('GET /api/upscale', () => {
    it('should return upscale status for artwork', async () => {
      const artwork = {
        id: 'artwork-123',
        generated_image_url: 'https://example.com/artwork.jpg',
        upscale_status: 'completed' as const,
        upscaled_image_url: 'https://example.com/upscaled.jpg',
        upscaled_at: '2024-01-01T12:00:00Z',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        original_image_url: 'https://example.com/original.jpg',
        generation_status: 'completed' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseArtworks.getArtworkById.mockResolvedValue(artwork);

      const request = new NextRequest('http://localhost:3000/api/upscale?artworkId=artwork-123');

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.upscale_status).toBe('completed');
      expect(result.upscaled_image_url).toBe('https://example.com/upscaled.jpg');
      expect(result.upscaled_at).toBe('2024-01-01T12:00:00Z');
    });

    it('should return 400 if artworkId is missing from query', async () => {
      const request = new NextRequest('http://localhost:3000/api/upscale');

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Artwork ID is required');
    });

    it('should return 404 if artwork not found', async () => {
      mockSupabaseArtworks.getArtworkById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/upscale?artworkId=nonexistent');

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Artwork not found');
    });
  });
});

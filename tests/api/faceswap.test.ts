// tests/api/faceswap.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/faceswap/route';
import { NextRequest } from 'next/server';

// Mock the ViewComfy client
vi.mock('@/lib/viewcomfy', () => ({
  performFaceSwap: vi.fn(),
}));

// Mock Supabase storage
vi.mock('@/lib/supabase-storage', () => ({
  storeFalImageInSupabase: vi.fn(),
}));

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
  trackFalAiUsage: vi.fn(),
}));

describe('/api/faceswap', () => {
  const mockPerformFaceSwap = vi.mocked(await import('@/lib/viewcomfy')).performFaceSwap;
  const mockStoreFalImageInSupabase = vi.mocked(await import('@/lib/supabase-storage')).storeFalImageInSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/faceswap', () => {
    it('should successfully perform faceswap with JSON input', async () => {
      // Mock successful faceswap
      const mockFaceswapUrl = 'https://viewcomfy.com/output/faceswap-result.jpg';
      const mockSupabaseUrl = 'https://supabase.co/storage/faceswap-result.jpg';
      
      mockPerformFaceSwap.mockResolvedValue(mockFaceswapUrl);
      mockStoreFalImageInSupabase.mockResolvedValue(mockSupabaseUrl);

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'test-artwork-123'
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(mockSupabaseUrl);
      expect(result.viewcomfyUrl).toBe(mockFaceswapUrl);
      expect(result.supabaseUrl).toBe(mockSupabaseUrl);

      expect(mockPerformFaceSwap).toHaveBeenCalledWith({
        sourceImageUrl: 'https://example.com/pet-mom.jpg',
        targetImageUrl: 'https://example.com/monalisa.jpg',
        artworkId: 'test-artwork-123'
      });

      expect(mockStoreFalImageInSupabase).toHaveBeenCalledWith(
        mockFaceswapUrl,
        'test-artwork-123',
        'faceswap_result'
      );
    });

    it('should handle missing required parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          // Missing targetImageUrl
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Both sourceImageUrl and targetImageUrl are required');
    });

    it('should fallback to ViewComfy URL when Supabase storage fails', async () => {
      const mockFaceswapUrl = 'https://viewcomfy.com/output/faceswap-result.jpg';
      
      mockPerformFaceSwap.mockResolvedValue(mockFaceswapUrl);
      mockStoreFalImageInSupabase.mockRejectedValue(new Error('Storage failed'));

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'test-artwork-123'
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(mockFaceswapUrl);
      expect(result.viewcomfyUrl).toBeUndefined();
      expect(result.supabaseUrl).toBeUndefined();
    });

    it('should handle ViewComfy API errors', async () => {
      mockPerformFaceSwap.mockRejectedValue(new Error('ViewComfy API error: 503 Service Unavailable'));

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'test-artwork-123'
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(503);
      expect(result.error).toBe('FaceSwap service temporarily unavailable. Please try again.');
    });

    it('should handle ViewComfy configuration errors', async () => {
      mockPerformFaceSwap.mockRejectedValue(new Error('Missing ViewComfy configuration'));

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'test-artwork-123'
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('FaceSwap service not configured properly.');
    });

    it('should handle generic errors', async () => {
      mockPerformFaceSwap.mockRejectedValue(new Error('Unknown error'));

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'test-artwork-123'
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('FaceSwap failed');
      expect(result.details).toBe('Unknown error');
    });

    it('should reject FormData uploads with helpful error', async () => {
      const formData = new FormData();
      formData.append('sourceImage', new File(['test'], 'source.jpg', { type: 'image/jpeg' }));
      formData.append('targetImage', new File(['test'], 'target.jpg', { type: 'image/jpeg' }));

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('FaceSwap failed');
      expect(result.details).toContain('File upload not implemented');
    });

    it('should include artworkId in ViewComfy parameters', async () => {
      const mockFaceswapUrl = 'https://viewcomfy.com/output/faceswap-result.jpg';
      mockPerformFaceSwap.mockResolvedValue(mockFaceswapUrl);
      mockStoreFalImageInSupabase.mockResolvedValue('https://supabase.co/storage/result.jpg');

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: 'custom-artwork-456'
        }),
      });

      await POST(request);

      expect(mockPerformFaceSwap).toHaveBeenCalledWith({
        sourceImageUrl: 'https://example.com/pet-mom.jpg',
        targetImageUrl: 'https://example.com/monalisa.jpg',
        artworkId: 'custom-artwork-456'
      });
    });

    it('should generate temporary artworkId when not provided', async () => {
      const mockFaceswapUrl = 'https://viewcomfy.com/output/faceswap-result.jpg';
      mockPerformFaceSwap.mockResolvedValue(mockFaceswapUrl);
      mockStoreFalImageInSupabase.mockResolvedValue('https://supabase.co/storage/result.jpg');

      const request = new NextRequest('http://localhost:3000/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          // No artworkId provided
        }),
      });

      await POST(request);

      expect(mockPerformFaceSwap).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceImageUrl: 'https://example.com/pet-mom.jpg',
          targetImageUrl: 'https://example.com/monalisa.jpg',
          artworkId: expect.stringMatching(/^temp_\d+$/)
        })
      );
    });
  });
});

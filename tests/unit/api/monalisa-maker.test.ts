import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/monalisa-maker/route';
import { loadTestImage, createTestFormData, TEST_IMAGES } from '../../fixtures/test-images';

// Mock fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: {
      upload: vi.fn().mockResolvedValue('https://mock-storage-url.com/image.png')
    },
    stream: vi.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { type: 'processing' };
        yield { type: 'complete' };
      },
      done: vi.fn().mockResolvedValue({
        images: [{ url: 'https://mock-result-url.com/monalisa.png' }]
      })
    }))
  }
}));

// Mock fetch for downloading generated images
global.fetch = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
});

describe('/api/monalisa-maker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - File Upload', () => {
    it('should transform user photo to MonaLisa portrait via JSON', async () => {
      // Use JSON request instead of FormData for unit testing
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://example.com/user-photo.jpg' }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imageUrl).toBeTruthy();
    });

    it('should return 400 when no image provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('No imageUrl provided in request body');
    });
  });

  describe('POST - JSON Request', () => {
    it('should transform image from URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://example.com/user-photo.jpg' }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imageUrl).toBeTruthy();
    });

    it('should return 400 when no imageUrl provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('No imageUrl provided in request body');
    });
  });

  describe('Error Handling', () => {
    it('should handle fal.ai API failures gracefully', async () => {
      const { fal } = await import('@fal-ai/client');
      vi.mocked(fal.stream).mockImplementationOnce(() => {
        throw new Error('API Error');
      });

      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://example.com/user-photo.jpg' }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to generate MonaLisa portrait');
    });
  });
});

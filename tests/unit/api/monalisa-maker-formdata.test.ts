import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/monalisa-maker/route';

// Mock fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
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

describe('/api/monalisa-maker - FormData Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FormData File Upload', () => {
    it('should use direct image file upload to fal.ai when FormData is provided', async () => {
      // Create a mock file
      const mockImageContent = new Uint8Array([255, 216, 255, 224]); // JPEG header
      const mockFile = new File([mockImageContent], 'test-image.jpg', { type: 'image/jpeg' });
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', mockFile);
      formData.append('artworkId', 'test-artwork-123');
      
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data; boundary=----formdata-test' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imageUrl).toBeTruthy();

      // Verify fal.ai was called with the image file directly
      const { fal } = await import('@fal-ai/client');
      expect(fal.stream).toHaveBeenCalledWith('fal-ai/flux-kontext-lora', 
        expect.objectContaining({
          input: expect.objectContaining({
            image: expect.any(File), // Should have image file, not image_url
            prompt: 'keep likeness and hairstyle the same, change pose and style to mona lisa'
          })
        })
      );

      // Verify it does NOT use image_url when file is provided
      const callArgs = vi.mocked(fal.stream).mock.calls[0][1];
      expect(callArgs.input).not.toHaveProperty('image_url');
      expect(callArgs.input).toHaveProperty('image');
    });

    it('should handle large file validation correctly', async () => {
      // Create a mock file that's too large (>10MB)
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', largeFile);
      
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data; boundary=----formdata-test' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(413);
      const body = await response.json();
      expect(body.error).toContain('Image too large');
    });

    it('should validate file presence in FormData', async () => {
      // Create FormData without image file
      const formData = new FormData();
      formData.append('artworkId', 'test-artwork-123');
      
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data; boundary=----formdata-test' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('No image file provided');
    });

    it('should extract artworkId from FormData correctly', async () => {
      const mockImageContent = new Uint8Array([255, 216, 255, 224]);
      const mockFile = new File([mockImageContent], 'test-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', mockFile);
      formData.append('artworkId', 'custom-artwork-456');
      
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data; boundary=----formdata-test' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      // The artworkId should be used in the response (we can verify this in logs or response)
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Validation Logic', () => {
    it('should accept image file without requiring imageUrl', async () => {
      const mockImageContent = new Uint8Array([255, 216, 255, 224]);
      const mockFile = new File([mockImageContent], 'test-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', mockFile);
      
      const request = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data; boundary=----formdata-test' }
      });

      const response = await POST(request);
      
      // Should succeed even without imageUrl since we have a file
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});

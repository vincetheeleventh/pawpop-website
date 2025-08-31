import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/monalisa-complete/route';
import { loadTestImage, TEST_IMAGES } from '../fixtures/test-images';

// Mock fal.ai client for integration test
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: {
      upload: vi.fn()
        .mockResolvedValueOnce('https://mock-user-url.com/user.png')
        .mockResolvedValueOnce('https://mock-pet-url.com/pet.png')
    },
    stream: vi.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { type: 'processing' };
        yield { type: 'complete' };
      },
      done: vi.fn().mockResolvedValue({
        images: [{ url: 'https://mock-monalisa-url.com/monalisa.png' }]
      })
    })),
    subscribe: vi.fn().mockResolvedValue({
      data: {
        images: [{ url: 'https://mock-final-url.com/final.jpg' }]
      },
      requestId: 'mock-request-id'
    })
  }
}));

// Mock fetch for downloading generated images
global.fetch = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(4096))
});

describe('Complete MonaLisa Maker Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full pipeline: user photo + pet → final portrait', async () => {
    // Use JSON request instead of FormData for integration testing
    const request = new NextRequest('http://localhost:3000/api/monalisa-complete', {
      method: 'POST',
      body: JSON.stringify({
        userImageUrl: 'https://example.com/user-photo.jpg',
        petImageUrl: 'https://example.com/pet.jpg'
      }),
      headers: { 'content-type': 'application/json' }
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('X-Generated-Image-URL')).toBeTruthy();
    expect(response.headers.get('X-MonaLisa-Portrait-URL')).toBeTruthy();
    expect(response.headers.get('X-Request-ID')).toBeTruthy();
  });

  it('should handle step 1 failure gracefully', async () => {
    const { fal } = await import('@fal-ai/client');
    vi.mocked(fal.stream).mockImplementationOnce(() => {
      throw new Error('Step 1 failed');
    });

    const request = new NextRequest('http://localhost:3000/api/monalisa-complete', {
      method: 'POST',
      body: JSON.stringify({
        userImageUrl: 'https://example.com/user-photo.jpg',
        petImageUrl: 'https://example.com/pet.jpg'
      }),
      headers: { 'content-type': 'application/json' }
    });

    const response = await POST(request);
    
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Complete MonaLisa Maker pipeline failed');
  });

  it('should verify correct API calls sequence', async () => {
    const { fal } = await import('@fal-ai/client');
    
    const request = new NextRequest('http://localhost:3000/api/monalisa-complete', {
      method: 'POST',
      body: JSON.stringify({
        userImageUrl: 'https://example.com/user-photo.jpg',
        petImageUrl: 'https://example.com/pet.jpg'
      }),
      headers: { 'content-type': 'application/json' }
    });

    await POST(request);
    
    // Verify Step 1: MonaLisa Maker
    expect(fal.stream).toHaveBeenCalledWith('fal-ai/flux-kontext-lora', 
      expect.objectContaining({
        input: expect.objectContaining({
          image_url: 'https://example.com/user-photo.jpg',
          prompt: 'keep likeness, change pose and style to mona lisa, keep hairstyle',
          loras: [{
            path: 'https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors',
            scale: 1.0
          }],
          resolution_mode: '9:16',
          guidance_scale: 7.5,
          num_inference_steps: 28,
          seed: expect.any(Number)
        })
      })
    );

    // Verify Step 2: Pet Integration
    expect(fal.subscribe).toHaveBeenCalledWith('fal-ai/flux-pro/kontext/max/multi', 
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet',
          guidance_scale: 3.5,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '2',
          image_urls: [
            'https://mock-monalisa-url.com/monalisa.png',
            'https://example.com/pet.jpg'
          ],
          aspect_ratio: '9:16'
        })
      })
    );
  });
});

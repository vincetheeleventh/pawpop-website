import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: {
      upload: vi.fn().mockResolvedValue('https://test.fal.media/uploaded-image.jpg')
    },
    stream: vi.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { type: 'processing' };
        yield { type: 'complete' };
      },
      done: vi.fn().mockResolvedValue({
        images: [{ url: 'https://test.fal.media/monalisa-result.jpg' }]
      })
    })),
    subscribe: vi.fn().mockResolvedValue({
      data: {
        images: [{ url: 'https://test.fal.media/final-result.jpg' }]
      },
      requestId: 'test-request-123'
    })
  }
}));

// Mock Supabase
vi.mock('@/lib/supabase-artworks', () => ({
  createArtwork: vi.fn().mockResolvedValue({
    artwork: {
      id: 'test-artwork-id',
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      generation_status: 'pending'
    },
    access_token: 'test-token-123'
  }),
  updateArtwork: vi.fn().mockResolvedValue({
    id: 'test-artwork-id',
    generation_status: 'completed',
    generated_image_url: 'https://test.fal.media/final-result.jpg'
  }),
  getArtworkByToken: vi.fn().mockResolvedValue({
    id: 'test-artwork-id',
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    generated_image_url: 'https://test.fal.media/final-result.jpg',
    generation_status: 'completed'
  })
}));

describe('Image Generation API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/monalisa-maker', () => {
    it('should transform user photo to Mona Lisa style', async () => {
      const { POST } = await import('@/app/api/monalisa-maker/route');
      
      // Create mock file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('image', mockFile);

      // Create mock NextRequest
      const req = new NextRequest('http://localhost:3000/api/monalisa-maker', {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
      });

      // Mock FormData methods
      req.formData = vi.fn().mockResolvedValue(formData);

      const response = await POST(req);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('X-Generated-Image-URL')).toBe('https://test.fal.media/monalisa-result.jpg');
    });

    it('should handle JSON input with image URL', async () => {
      const { POST } = await import('@/app/api/monalisa-maker/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { imageUrl: 'https://test.com/user-photo.jpg' }
      });

      req.json = vi.fn().mockResolvedValue({ imageUrl: 'https://test.com/user-photo.jpg' });

      const response = await POST(req as any);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Generated-Image-URL')).toBe('https://test.fal.media/monalisa-result.jpg');
    });

    it('should return 400 for missing image', async () => {
      const { POST } = await import('@/app/api/monalisa-maker/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {}
      });

      req.json = vi.fn().mockResolvedValue({});

      const response = await POST(req as any);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('No imageUrl provided');
    });
  });

  describe('/api/pet-integration', () => {
    it('should integrate pet into Mona Lisa portrait', async () => {
      const { POST } = await import('@/app/api/pet-integration/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          portraitUrl: 'https://test.fal.media/monalisa-result.jpg',
          petUrl: 'https://test.com/pet-photo.jpg'
        }
      });

      req.json = vi.fn().mockResolvedValue({
        portraitUrl: 'https://test.fal.media/monalisa-result.jpg',
        petUrl: 'https://test.com/pet-photo.jpg'
      });

      const response = await POST(req as any);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('X-Generated-Image-URL')).toBe('https://test.fal.media/final-result.jpg');
      expect(response.headers.get('X-Request-ID')).toBe('test-request-123');
    });

    it('should return 400 for missing URLs', async () => {
      const { POST } = await import('@/app/api/pet-integration/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { portraitUrl: 'https://test.com/portrait.jpg' }
      });

      req.json = vi.fn().mockResolvedValue({ portraitUrl: 'https://test.com/portrait.jpg' });

      const response = await POST(req as any);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Both portraitUrl and petUrl are required');
    });
  });

  describe('/api/monalisa-complete', () => {
    it('should complete full pipeline from user and pet images', async () => {
      const { POST } = await import('@/app/api/monalisa-complete/route');
      
      const mockUserFile = new File(['user'], 'user.jpg', { type: 'image/jpeg' });
      const mockPetFile = new File(['pet'], 'pet.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('userImage', mockUserFile);
      formData.append('petImage', mockPetFile);

      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' }
      });

      req.formData = vi.fn().mockResolvedValue(formData);

      const response = await POST(req as any);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('X-Generated-Image-URL')).toBe('https://test.fal.media/final-result.jpg');
      expect(response.headers.get('X-Request-ID')).toBe('test-request-123');
      expect(response.headers.get('X-MonaLisa-Portrait-URL')).toBe('https://test.fal.media/monalisa-result.jpg');
    });

    it('should handle JSON input with URLs', async () => {
      const { POST } = await import('@/app/api/monalisa-complete/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          userImageUrl: 'https://test.com/user.jpg',
          petImageUrl: 'https://test.com/pet.jpg'
        }
      });

      req.json = vi.fn().mockResolvedValue({
        userImageUrl: 'https://test.com/user.jpg',
        petImageUrl: 'https://test.com/pet.jpg'
      });

      const response = await POST(req as any);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Generated-Image-URL')).toBe('https://test.fal.media/final-result.jpg');
    });
  });

  describe('/api/artwork/create', () => {
    it('should create new artwork record', async () => {
      const { POST } = await import('@/app/api/artwork/create/route');
      
      const { req } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          customer_name: 'Test User',
          customer_email: 'test@example.com',
          original_image_url: 'https://test.com/original.jpg'
        }
      });

      req.json = vi.fn().mockResolvedValue({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        original_image_url: 'https://test.com/original.jpg'
      });

      const response = await POST(req as any);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.artwork.customer_name).toBe('Test User');
      expect(data.access_token).toBe('test-token-123');
    });
  });

  describe('/api/artwork/[token]', () => {
    it('should retrieve artwork by token', async () => {
      const { GET } = await import('@/app/api/artwork/[token]/route');
      
      const { req } = createMocks({ method: 'GET' });

      const response = await GET(req as any, { params: { token: 'test-token-123' } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.artwork.id).toBe('test-artwork-id');
      expect(data.artwork.customer_name).toBe('Test User');
      expect(data.artwork.generation_status).toBe('completed');
    });

    it('should return 404 for invalid token', async () => {
      const { getArtworkByToken } = await import('@/lib/supabase-artworks');
      vi.mocked(getArtworkByToken).mockResolvedValueOnce(null);

      const { GET } = await import('@/app/api/artwork/[token]/route');
      
      const { req } = createMocks({ method: 'GET' });

      const response = await GET(req as any, { params: { token: 'invalid-token' } });
      
      expect(response.status).toBe(404);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Create mock storage methods
const mockStorageFrom = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      })
    }
  }))
}));

// Import after mocking
const { uploadImageToSupabaseStorage, generateArtworkFileName, storeFalImageInSupabase } = await import('../../src/lib/supabase-storage');

describe('Supabase Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateArtworkFileName', () => {
    it('should generate filename with artwork ID and step', () => {
      const fileName = generateArtworkFileName('123', 'monalisa_base');
      expect(fileName).toMatch(/^123\/monalisa_base_\d+\.jpg$/);
    });

    it('should support custom extension', () => {
      const fileName = generateArtworkFileName('123', 'artwork_final', 'png');
      expect(fileName).toMatch(/^123\/artwork_final_\d+\.png$/);
    });
  });

  describe('uploadImageToSupabaseStorage', () => {
    it('should upload image successfully', async () => {
      // Mock fetch response
      const mockImageBuffer = new ArrayBuffer(1024);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer),
        headers: {
          get: () => 'image/jpeg'
        }
      });

      // Mock Supabase upload
      mockUpload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/test-path' }
      });

      const result = await uploadImageToSupabaseStorage(
        'https://fal.ai/test-image.jpg',
        'test-filename.jpg'
      );

      expect(result).toBe('https://supabase.co/storage/test-path');
      expect(global.fetch).toHaveBeenCalledWith('https://fal.ai/test-image.jpg');
      expect(mockUpload).toHaveBeenCalledWith(
        'test-filename.jpg',
        mockImageBuffer,
        {
          contentType: 'image/jpeg',
          upsert: true
        }
      );
    });

    it('should handle fetch failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(
        uploadImageToSupabaseStorage('https://fal.ai/invalid.jpg', 'test.jpg')
      ).rejects.toThrow('Failed to fetch image: Not Found');
    });

    it('should handle Supabase upload failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        headers: { get: () => 'image/jpeg' }
      });

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' }
      });

      await expect(
        uploadImageToSupabaseStorage('https://fal.ai/test.jpg', 'test.jpg')
      ).rejects.toThrow('Supabase storage upload failed: Storage quota exceeded');
    });
  });

  describe('storeFalImageInSupabase', () => {
    it('should store fal.ai image with generated filename', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        headers: { get: () => 'image/jpeg' }
      });

      mockUpload.mockResolvedValue({
        data: { path: 'artwork-123/monalisa_base_123456.jpg' },
        error: null
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/artwork-123/monalisa_base_123456.jpg' }
      });

      const result = await storeFalImageInSupabase(
        'https://fal.ai/generated.jpg',
        '123',
        'monalisa_base'
      );

      expect(result).toBe('https://supabase.co/storage/artwork-123/monalisa_base_123456.jpg');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^123\/monalisa_base_\d+\.jpg$/),
        expect.any(ArrayBuffer),
        {
          contentType: 'image/jpeg',
          upsert: true
        }
      );
    });
  });
});

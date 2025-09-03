import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createArtwork, 
  getArtworkByToken, 
  updateArtwork, 
  getArtworksByStatus,
  getArtworksByCustomer 
} from '@/lib/supabase-artworks';

// Mock Supabase client
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gt: vi.fn(() => ({
          single: vi.fn()
        })),
        single: vi.fn(),
        order: vi.fn(() => ({
          // For getArtworksByStatus
        }))
      })),
      order: vi.fn(() => ({
        // For getArtworksByCustomer
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin
}));

vi.mock('@/lib/utils', () => ({
  generateSecureToken: vi.fn(() => 'mock-secure-token-123')
}));

describe('Supabase Artworks Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createArtwork', () => {
    it('should create artwork with access token', async () => {
      const mockArtwork = {
        id: 'artwork-123',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        original_image_url: 'https://test.com/original.jpg',
        access_token: 'mock-secure-token-123',
        generation_status: 'pending'
      };

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValueOnce({
        data: mockArtwork,
        error: null
      });

      const result = await createArtwork({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        original_image_url: 'https://test.com/original.jpg'
      });

      expect(result.artwork).toEqual(mockArtwork);
      expect(result.access_token).toBe('mock-secure-token-123');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('artworks');
    });

    it('should handle creation errors', async () => {
      mockSupabaseAdmin.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(createArtwork({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        original_image_url: 'https://test.com/original.jpg'
      })).rejects.toThrow('Failed to create artwork: Database error');
    });
  });

  describe('getArtworkByToken', () => {
    it('should retrieve artwork by valid token', async () => {
      const mockArtwork = {
        id: 'artwork-123',
        customer_name: 'Test User',
        generated_image_url: 'https://test.com/generated.jpg',
        generation_status: 'completed'
      };

      mockSupabaseAdmin.from().select().eq().gt().single.mockResolvedValueOnce({
        data: mockArtwork,
        error: null
      });

      const result = await getArtworkByToken('valid-token-123');

      expect(result).toEqual(mockArtwork);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('artworks');
    });

    it('should return null for invalid token', async () => {
      mockSupabaseAdmin.from().select().eq().gt().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No matching record
      });

      const result = await getArtworkByToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSupabaseAdmin.from().select().eq().gt().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed', code: 'OTHER_ERROR' }
      });

      await expect(getArtworkByToken('test-token')).rejects.toThrow('Failed to fetch artwork: Connection failed');
    });
  });

  describe('updateArtwork', () => {
    it('should update artwork successfully', async () => {
      const updatedArtwork = {
        id: 'artwork-123',
        generated_image_url: 'https://test.com/final.jpg',
        generation_status: 'completed'
      };

      mockSupabaseAdmin.from().update().eq().select().single.mockResolvedValueOnce({
        data: updatedArtwork,
        error: null
      });

      const result = await updateArtwork('artwork-123', {
        generated_image_url: 'https://test.com/final.jpg',
        generation_status: 'completed'
      });

      expect(result).toEqual(updatedArtwork);
      expect(mockSupabaseAdmin.from().update).toHaveBeenCalledWith({
        generated_image_url: 'https://test.com/final.jpg',
        generation_status: 'completed'
      });
    });

    it('should handle update errors', async () => {
      mockSupabaseAdmin.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(updateArtwork('artwork-123', { generation_status: 'completed' }))
        .rejects.toThrow('Failed to update artwork: Update failed');
    });
  });

  describe('getArtworksByStatus', () => {
    it('should retrieve artworks by status', async () => {
      const mockArtworks = [
        { id: 'artwork-1', generation_status: 'pending' },
        { id: 'artwork-2', generation_status: 'pending' }
      ];

      mockSupabaseAdmin.from().select().eq().order.mockResolvedValueOnce({
        data: mockArtworks,
        error: null
      });

      const result = await getArtworksByStatus('pending');

      expect(result).toEqual(mockArtworks);
      expect(mockSupabaseAdmin.from().select().eq).toHaveBeenCalledWith('generation_status', 'pending');
    });

    it('should return empty array when no artworks found', async () => {
      mockSupabaseAdmin.from().select().eq().order.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await getArtworksByStatus('completed');

      expect(result).toEqual([]);
    });
  });

  describe('getArtworksByCustomer', () => {
    it('should retrieve artworks by customer email', async () => {
      const mockArtworks = [
        { id: 'artwork-1', customer_email: 'test@example.com' },
        { id: 'artwork-2', customer_email: 'test@example.com' }
      ];

      mockSupabaseAdmin.from().select().eq().order.mockResolvedValueOnce({
        data: mockArtworks,
        error: null
      });

      const result = await getArtworksByCustomer('test@example.com');

      expect(result).toEqual(mockArtworks);
      expect(mockSupabaseAdmin.from().select().eq).toHaveBeenCalledWith('customer_email', 'test@example.com');
    });
  });

  describe('Token Security', () => {
    it('should generate secure tokens with proper expiration', async () => {
      const mockArtwork = {
        id: 'artwork-123',
        access_token: 'mock-secure-token-123',
        token_expires_at: expect.any(String)
      };

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValueOnce({
        data: mockArtwork,
        error: null
      });

      const result = await createArtwork({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        original_image_url: 'https://test.com/original.jpg'
      });

      expect(result.access_token).toBe('mock-secure-token-123');
      
      // Verify token expiration is set (30 days from now)
      const insertCall = mockSupabaseAdmin.from().insert.mock.calls[0][0];
      const expirationDate = new Date(insertCall.token_expires_at);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      expect(expirationDate.getTime()).toBeCloseTo(thirtyDaysFromNow.getTime(), -10000); // Within 10 seconds
    });

    it('should filter expired tokens in getArtworkByToken', async () => {
      await getArtworkByToken('test-token');

      expect(mockSupabaseAdmin.from().select().eq().gt).toHaveBeenCalledWith(
        'token_expires_at', 
        expect.any(String)
      );
    });
  });
});

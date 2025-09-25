import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { expect } from 'vitest';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env.local' });

// Set up test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.FAL_KEY = process.env.FAL_KEY || 'test-fal-key';

// Mock monitoring service to avoid Supabase initialization issues
vi.mock('@/lib/monitoring', () => ({
  trackFalAiUsage: vi.fn().mockResolvedValue(undefined),
  MonitoringService: vi.fn().mockImplementation(() => ({
    checkSupabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy' }),
    createAlert: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Supabase Storage functions
vi.mock('@/lib/supabase-storage', () => ({
  storeFalImageInSupabase: vi.fn().mockResolvedValue('https://supabase-storage-url.com/image.jpg')
}));

// Mock admin review functions
vi.mock('@/lib/admin-review', () => ({
  isHumanReviewEnabled: vi.fn().mockReturnValue(false),
  createAdminReview: vi.fn().mockResolvedValue(undefined)
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeAll(() => {
  // Mock localStorage globally
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  // Ensure required environment variables are set
  if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
    console.warn('Warning: No FAL_KEY or HF_TOKEN found. Some tests may fail.');
  }
});

beforeEach(() => {
  // Reset localStorage mock before each test
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

afterAll(() => {
  // Cleanup after all tests
});

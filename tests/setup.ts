import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { expect } from 'vitest';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env.local' });

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

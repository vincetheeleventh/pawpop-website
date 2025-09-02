import { beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env.local' });

beforeAll(() => {
  // Ensure required environment variables are set
  if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
    console.warn('Warning: No FAL_KEY or HF_TOKEN found. Some tests may fail.');
  }
});

afterAll(() => {
  // Cleanup after all tests
});

// Global setup for Playwright tests
import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });
  
  // Ensure critical environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set for testing`);
    }
  }

  console.log('✅ Test environment variables loaded successfully');
}

export default globalSetup;

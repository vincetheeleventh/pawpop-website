#!/usr/bin/env node

/**
 * E2E Test Runner
 * Runs the critical pipeline end-to-end test with proper setup
 */

const { spawn } = require('child_process');
const path = require('path');

async function runE2ETest() {
  console.log('🚀 CRITICAL PIPELINE E2E TEST RUNNER');
  console.log('====================================');
  
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  try {
    require(packageJsonPath);
    console.log('✅ Found package.json, running from project root');
  } catch (error) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
  }
  
  // Check if Playwright is installed
  try {
    require('@playwright/test');
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.error('❌ Playwright is not installed. Run: npm install @playwright/test');
    process.exit(1);
  }
  
  console.log('\n📋 TEST CONFIGURATION:');
  console.log(`   Base URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`);
  console.log(`   Test Email: test@pawpopart.com`);
  console.log(`   Admin Email: pawpopart@gmail.com`);
  console.log(`   Timeout: 2 minutes per step`);
  
  console.log('\n🔧 PRE-TEST CHECKS:');
  
  // Check if development server is running
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    if (response.ok) {
      console.log('✅ Development server is running');
    } else {
      console.log('⚠️ Development server responded with error, but continuing...');
    }
  } catch (error) {
    console.log('⚠️ Development server may not be running. Make sure to start it with: npm run dev');
  }
  
  // Check environment variables
  const criticalEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FAL_KEY',
    'RESEND_API_KEY'
  ];
  
  let envIssues = 0;
  criticalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: SET`);
    } else {
      console.log(`❌ ${envVar}: NOT SET`);
      envIssues++;
    }
  });
  
  if (envIssues > 0) {
    console.log(`\n⚠️ ${envIssues} environment variables are missing. The test may fail.`);
    console.log('Make sure your .env.local file is properly configured.');
  }
  
  console.log('\n🎭 STARTING PLAYWRIGHT TEST...');
  console.log('==============================');
  
  // Run the Playwright test
  const playwrightArgs = [
    'test',
    'tests/e2e/critical-pipeline.spec.ts',
    '--headed', // Run in headed mode to see what's happening
    '--project=chromium', // Use Chrome for better debugging
    '--timeout=300000', // 5 minute timeout per test
    '--retries=1', // Retry once on failure
    '--reporter=list', // Use list reporter for better console output
    '--workers=1' // Run tests sequentially
  ];
  
  const playwrightProcess = spawn('npx', ['playwright', ...playwrightArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  playwrightProcess.on('close', (code) => {
    console.log('\n🎯 E2E TEST COMPLETED');
    console.log('====================');
    
    if (code === 0) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('');
      console.log('🎉 CRITICAL PIPELINE IS FULLY FUNCTIONAL!');
      console.log('');
      console.log('The test verified:');
      console.log('✅ Environment and API health');
      console.log('✅ Pet photo upload and artwork generation');
      console.log('✅ Admin review system');
      console.log('✅ Order creation and recovery');
      console.log('✅ Success page retry logic');
      console.log('✅ Email system endpoints');
      console.log('✅ High-res upscaling pipeline');
      console.log('✅ Complete end-to-end flow');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('');
      console.log('Check the test output above for details.');
      console.log('Common issues:');
      console.log('- Development server not running (npm run dev)');
      console.log('- Missing environment variables');
      console.log('- Network connectivity issues');
      console.log('- FAL.ai API rate limits');
      console.log('');
      console.log('Run with --debug flag for more detailed output.');
    }
    
    process.exit(code);
  });
  
  playwrightProcess.on('error', (error) => {
    console.error('❌ Failed to start Playwright:', error);
    process.exit(1);
  });
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Critical Pipeline E2E Test Runner');
  console.log('');
  console.log('Usage: node scripts/run-e2e-test.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  NEXT_PUBLIC_BASE_URL    Base URL for testing (default: http://localhost:3000)');
  console.log('  FAL_KEY                 FAL.ai API key for image generation');
  console.log('  RESEND_API_KEY          Resend API key for email testing');
  console.log('  SUPABASE_*              Supabase configuration');
  console.log('');
  console.log('Prerequisites:');
  console.log('  1. Development server running (npm run dev)');
  console.log('  2. All environment variables configured');
  console.log('  3. Playwright installed (npm install @playwright/test)');
  process.exit(0);
}

// Run the test
runE2ETest().catch(error => {
  console.error('❌ E2E test runner failed:', error);
  process.exit(1);
});

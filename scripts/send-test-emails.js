#!/usr/bin/env node
/**
 * Send Test Emails to pawpopart@gmail.com
 * This script sends all email-first flow email templates for preview
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'pawpopart@gmail.com';
const TEST_NAME = 'Test User';
const TEST_TOKEN = 'sample-upload-token-123';

console.log('📧 Sending test emails to:', TEST_EMAIL);
console.log('');

async function sendTestEmails() {
  const results = [];

  // 1. Upload Confirmation Email (for "Upload Later" choice)
  console.log('1️⃣  Sending Upload Confirmation Email...');
  try {
    const response = await fetch(`${BASE_URL}/api/email/capture-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: TEST_NAME,
        customerEmail: TEST_EMAIL,
        uploadUrl: `${BASE_URL}/upload/${TEST_TOKEN}`
      })
    });

    if (response.ok) {
      console.log('   ✅ Upload Confirmation Email sent');
      results.push({ email: 'Upload Confirmation', status: 'sent' });
    } else {
      const error = await response.json();
      console.log('   ❌ Failed:', error.error);
      results.push({ email: 'Upload Confirmation', status: 'failed', error: error.error });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.push({ email: 'Upload Confirmation', status: 'error', error: error.message });
  }

  console.log('');

  // 2. Upload Reminder Email #1
  console.log('2️⃣  Sending Upload Reminder Email #1...');
  try {
    const response = await fetch(`${BASE_URL}/api/email/upload-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: TEST_NAME,
        customerEmail: TEST_EMAIL,
        uploadUrl: `${BASE_URL}/upload/${TEST_TOKEN}`,
        artworkId: 'test-artwork-id',
        reminderNumber: 1
      })
    });

    if (response.ok) {
      console.log('   ✅ Upload Reminder #1 sent');
      results.push({ email: 'Upload Reminder #1', status: 'sent' });
    } else {
      const error = await response.json();
      console.log('   ❌ Failed:', error.error);
      results.push({ email: 'Upload Reminder #1', status: 'failed', error: error.error });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.push({ email: 'Upload Reminder #1', status: 'error', error: error.message });
  }

  console.log('');

  // 3. Upload Reminder Email #2
  console.log('3️⃣  Sending Upload Reminder Email #2...');
  try {
    const response = await fetch(`${BASE_URL}/api/email/upload-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: TEST_NAME,
        customerEmail: TEST_EMAIL,
        uploadUrl: `${BASE_URL}/upload/${TEST_TOKEN}`,
        artworkId: 'test-artwork-id',
        reminderNumber: 2
      })
    });

    if (response.ok) {
      console.log('   ✅ Upload Reminder #2 sent');
      results.push({ email: 'Upload Reminder #2', status: 'sent' });
    } else {
      const error = await response.json();
      console.log('   ❌ Failed:', error.error);
      results.push({ email: 'Upload Reminder #2', status: 'failed', error: error.error });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.push({ email: 'Upload Reminder #2', status: 'error', error: error.message });
  }

  console.log('');

  // 4. Upload Reminder Email #3 (Final)
  console.log('4️⃣  Sending Upload Reminder Email #3 (Final)...');
  try {
    const response = await fetch(`${BASE_URL}/api/email/upload-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: TEST_NAME,
        customerEmail: TEST_EMAIL,
        uploadUrl: `${BASE_URL}/upload/${TEST_TOKEN}`,
        artworkId: 'test-artwork-id',
        reminderNumber: 3
      })
    });

    if (response.ok) {
      console.log('   ✅ Upload Reminder #3 sent');
      results.push({ email: 'Upload Reminder #3', status: 'sent' });
    } else {
      const error = await response.json();
      console.log('   ❌ Failed:', error.error);
      results.push({ email: 'Upload Reminder #3', status: 'failed', error: error.error });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.push({ email: 'Upload Reminder #3', status: 'error', error: error.message });
  }

  console.log('');

  // 5. Masterpiece Creating Email (for reference)
  console.log('5️⃣  Sending Masterpiece Creating Email...');
  try {
    const response = await fetch(`${BASE_URL}/api/email/masterpiece-creating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: TEST_NAME,
        customerEmail: TEST_EMAIL,
        artworkToken: 'sample-artwork-token'
      })
    });

    if (response.ok) {
      console.log('   ✅ Masterpiece Creating Email sent');
      results.push({ email: 'Masterpiece Creating', status: 'sent' });
    } else {
      const error = await response.json();
      console.log('   ❌ Failed:', error.error);
      results.push({ email: 'Masterpiece Creating', status: 'failed', error: error.error });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.push({ email: 'Masterpiece Creating', status: 'error', error: error.message });
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log('═══════════════════════════════════════════════════════');
  
  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`✅ Sent: ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log('');

  results.forEach(result => {
    const icon = result.status === 'sent' ? '✅' : '❌';
    console.log(`${icon} ${result.email}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log('📬 Check your inbox at:', TEST_EMAIL);
  console.log('');
  console.log('💡 Note: Emails may take 1-2 minutes to arrive');
  console.log('💡 Check spam folder if not in inbox');
}

sendTestEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

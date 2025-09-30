#!/usr/bin/env node
/**
 * Cron Job: Send Upload Reminders
 * 
 * This script should be run periodically (e.g., every 6 hours) to send
 * automated upload reminder emails to users who chose "Upload Later"
 * 
 * Usage:
 *   node scripts/send-upload-reminders.js [--dry-run] [--hours=24] [--max-reminders=3]
 * 
 * Options:
 *   --dry-run         Check which artworks need reminders without sending emails
 *   --hours=N         Hours since email capture for first reminder (default: 24)
 *   --max-reminders=N Maximum number of reminders to send (default: 3)
 * 
 * Examples:
 *   node scripts/send-upload-reminders.js --dry-run
 *   node scripts/send-upload-reminders.js
 *   node scripts/send-upload-reminders.js --hours=12 --max-reminders=2
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const hoursArg = args.find(arg => arg.startsWith('--hours='));
const maxRemindersArg = args.find(arg => arg.startsWith('--max-reminders='));

const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
const maxReminders = maxRemindersArg ? parseInt(maxRemindersArg.split('=')[1]) : 3;

// Allow LOCAL_TEST=true to override and use localhost
const baseUrl = process.env.LOCAL_TEST === 'true' 
  ? 'http://localhost:3000'
  : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

async function sendReminders() {
  console.log('🚀 Starting upload reminder cron job...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no emails will be sent)' : 'LIVE'}`);
  console.log(`   Hours since capture: ${hours}`);
  console.log(`   Max reminders: ${maxReminders}`);
  console.log('');

  try {
    // Call the API endpoint
    const url = `${baseUrl}/api/email/upload-reminder?send=${!dryRun}&hours=${hours}&maxReminders=${maxReminders}`;
    
    console.log(`📡 Calling API: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    console.log('');
    console.log('📊 Results:');
    console.log(`   Total artworks needing reminders: ${data.totalArtworks || data.count || 0}`);
    
    if (dryRun) {
      console.log('');
      console.log('🔍 Artworks that would receive reminders:');
      if (data.artworks && data.artworks.length > 0) {
        data.artworks.forEach((artwork, index) => {
          console.log(`   ${index + 1}. ${artwork.customer_name} (${artwork.customer_email})`);
          console.log(`      - Email captured: ${new Date(artwork.email_captured_at).toLocaleString()}`);
          console.log(`      - Reminders sent: ${artwork.upload_reminder_count}`);
          console.log(`      - Next reminder: #${artwork.upload_reminder_count + 1}`);
          console.log('');
        });
      } else {
        console.log('   No artworks need reminders at this time.');
      }
    } else {
      console.log(`   Reminders sent successfully: ${data.remindersSent || 0}`);
      console.log('');
      
      if (data.results && data.results.length > 0) {
        console.log('📧 Detailed results:');
        data.results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌';
          console.log(`   ${status} ${result.email} - Reminder #${result.reminderNumber}`);
          if (!result.success && result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
      }
    }

    console.log('');
    console.log('✅ Cron job completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Cron job failed:', error.message);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the script
sendReminders();

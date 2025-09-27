#!/usr/bin/env node

/**
 * Simple script to check if ENABLE_HUMAN_REVIEW environment variable is set correctly
 */

console.log('🔍 Environment Variable Check');
console.log('=============================\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const enableHumanReview = process.env.ENABLE_HUMAN_REVIEW;

console.log('Environment Variable Status:');
console.log(`ENABLE_HUMAN_REVIEW = "${enableHumanReview}"`);
console.log(`Type: ${typeof enableHumanReview}`);
console.log(`Is "true": ${enableHumanReview === 'true'}`);
console.log('');

// Simulate the isHumanReviewEnabled function
function isHumanReviewEnabled() {
  return process.env.ENABLE_HUMAN_REVIEW === 'true';
}

const result = isHumanReviewEnabled();
console.log('Function Result:');
console.log(`isHumanReviewEnabled(): ${result}`);
console.log('');

if (result) {
  console.log('✅ Manual approval is ENABLED');
  console.log('   - Users will NOT be redirected after form submission');
  console.log('   - Users will receive email after admin approval');
} else {
  console.log('➡️ Manual approval is DISABLED');
  console.log('   - Users will be redirected to artwork page after generation');
  console.log('   - Users will receive immediate access to artwork');
}

console.log('\n🎯 Expected Console Log During Upload:');
if (result) {
  console.log('   "✅ Human review enabled - artwork pending admin approval, NO REDIRECT"');
} else {
  console.log('   "➡️ Human review disabled - redirecting to artwork page"');
}
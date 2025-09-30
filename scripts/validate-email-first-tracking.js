#!/usr/bin/env node

/**
 * Validation Script for Email-First Upload Modal Plausible Tracking
 * 
 * Checks that all required tracking events are present in the component
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Plausible Analytics Tracking in UploadModalEmailFirst...\n');

const componentPath = path.join(process.cwd(), 'src/components/forms/UploadModalEmailFirst.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

let passedChecks = 0;
let totalChecks = 0;

function checkTracking(description, searchString, required = true) {
  totalChecks++;
  const found = componentContent.includes(searchString);
  
  if (found) {
    console.log(`✅ ${description}`);
    passedChecks++;
  } else {
    console.log(`${required ? '❌' : '⚠️ '} ${description}`);
  }
  
  return found;
}

console.log('📊 Funnel Tracking Events:');
console.log('─────────────────────────────');
checkTracking('1. Modal Opening', 'trackFunnel.uploadModalOpened()');
checkTracking('2. Email Captured', 'trackFunnel.emailCaptured()');
checkTracking('3. Deferred Upload', 'trackFunnel.deferredUpload()');
checkTracking('4. Photo Uploaded', 'trackFunnel.photoUploaded(file.size, file.type)');
checkTracking('5. Generation Started', 'trackFunnel.artworkGenerationStarted()');
checkTracking('6. Artwork Completed', 'trackFunnel.artworkCompleted(generationTime)');

console.log('\n🖱️  Interaction Tracking Events:');
console.log('─────────────────────────────');
checkTracking('1. Modal Open', 'trackInteraction.modalOpen(\'Upload Modal - Email First\')');
checkTracking('2. Email Form Start', 'trackInteraction.formStart(\'Email Capture Form\')');
checkTracking('3. Email Form Complete', 'trackInteraction.formComplete(\'Email Capture Form\')');
checkTracking('4. Upload Now Button', 'trackInteraction.buttonClick(\'Upload Now\', \'upload-choice\')');
checkTracking('5. Upload Later Button', 'trackInteraction.buttonClick(\'Upload Later\', \'upload-choice\')');
checkTracking('6. Deferred Upload Complete', 'trackInteraction.formComplete(\'Deferred Upload Choice\')');
checkTracking('7. Photo Upload Feature', 'trackInteraction.featureUsed(\'Photo Upload\'');
checkTracking('8. Generation Form Start', 'trackInteraction.formStart(\'Upload Form - Email First\')');
checkTracking('9. Error Tracking', 'trackInteraction.error(\'Upload Form Error - Email First\'');
checkTracking('10. Exit Intent', 'trackInteraction.buttonClick(\'Exit Intent Triggered\', \'email-capture\')');

console.log('\n⚡ Performance Tracking:');
console.log('─────────────────────────────');
checkTracking('1. Image Generation Performance', 'trackPerformance.imageGeneration(\'Full Artwork Pipeline - Email First\'');

console.log('\n🎯 Microsoft Clarity Integration:');
console.log('─────────────────────────────');
checkTracking('1. Clarity Modal Open', 'clarityTracking.trackFunnel.uploadModalOpened()');
checkTracking('2. Clarity Email Started', 'clarityTracking.trackInteraction.formStarted(\'email_capture\')');
checkTracking('3. Clarity Email Completed', 'clarityTracking.trackInteraction.formCompleted(\'email_capture\')');
checkTracking('4. Clarity Upload Now', 'clarityTracking.trackInteraction.buttonClick(\'upload_now\'');
checkTracking('5. Clarity Upload Later', 'clarityTracking.trackInteraction.buttonClick(\'upload_later\'');
checkTracking('6. Clarity Photo Upload', 'clarityTracking.trackFunnel.photoUploaded(file.type, file.size)');
checkTracking('7. Clarity Generation Started', 'clarityTracking.trackFunnel.artworkGenerationStarted()');
checkTracking('8. Clarity Error Tracking', 'clarityTracking.trackInteraction.errorOccurred(\'upload_form_error_email_first\'');
checkTracking('9. Clarity Deferred Upload', 'clarityTracking.trackInteraction.formCompleted(\'deferred_upload\')');

console.log('\n🔗 Google Ads Integration:');
console.log('─────────────────────────────');
checkTracking('1. Artwork Generation Conversion', 'trackArtworkGeneration(artworkId, 15)');

console.log('\n🎭 Manual Approval Integration:');
console.log('─────────────────────────────');
checkTracking('1. Manual Approval Check', 'isHumanReviewEnabled()');
checkTracking('2. Pending Approval Tracking', 'Upload Form - Email First - Pending Approval');
checkTracking('3. Conditional Completion Tracking', 'trackFunnel.artworkCompleted(generationTime)');

console.log('\n📝 Event Naming Conventions:');
console.log('─────────────────────────────');
checkTracking('1. "Email First" Label Used', 'Email First');
checkTracking('2. Consistent Upload Form Naming', 'Upload Form - Email First');

console.log('\n🛡️  Error Handling:');
console.log('─────────────────────────────');
checkTracking('1. Try-Catch for Admin Review', 'try {');
checkTracking('2. Fallback Tracking', '} catch {');
checkTracking('3. Error Message Tracking', 'error instanceof Error ? error.message');

console.log('\n📋 Summary:');
console.log('═════════════════════════════');
console.log(`Checks Passed: ${passedChecks}/${totalChecks}`);
console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All tracking events validated successfully!');
  console.log('🚀 Email-first modal is ready for production with complete analytics tracking.');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalChecks - passedChecks} tracking event(s) missing or incorrect.`);
  console.log('📝 Review the output above and update UploadModalEmailFirst.tsx accordingly.');
  process.exit(1);
}

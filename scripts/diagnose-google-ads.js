#!/usr/bin/env node

/**
 * Google Ads Conversion Tracking Diagnostic Script
 * 
 * This script checks:
 * 1. Environment variables are set correctly
 * 2. Conversion IDs are in the correct format
 * 3. Tracking code is implemented in components
 * 4. gtag script is loading
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google Ads Conversion Tracking Diagnostics\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 1. Checking Environment Variables...\n');

const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID'
  ];
  
  let allSet = true;
  
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    if (value && value !== 'AW-CONVERSION_ID/CONVERSION_LABEL' && !value.includes('your_')) {
      console.log(`✅ ${varName}:`);
      console.log(`   ${value}`);
    } else {
      console.log(`❌ ${varName}: NOT SET or using placeholder`);
      allSet = false;
    }
  });
  
  if (!allSet) {
    console.log('\n⚠️  Some environment variables are missing or using placeholders!');
    console.log('   Make sure to set real conversion IDs from Google Ads.');
  } else {
    console.log('\n✅ All environment variables are set!');
  }
} else {
  console.log('❌ .env.local file not found!');
  console.log('   Create .env.local from .env.example and set your Google Ads IDs.');
}

// Check conversion ID format
console.log('\n📋 2. Validating Conversion ID Format...\n');

const conversionId = envVars['NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID'];
if (conversionId) {
  const awPattern = /^AW-\d+$/;
  if (awPattern.test(conversionId)) {
    console.log(`✅ Conversion ID format is valid: ${conversionId}`);
  } else {
    console.log(`❌ Conversion ID format is invalid: ${conversionId}`);
    console.log('   Expected format: AW-XXXXXXXXX');
  }
  
  // Check conversion action IDs
  const actionIds = [
    envVars['NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID'],
    envVars['NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID'],
    envVars['NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID'],
    envVars['NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID']
  ];
  
  const actionPattern = /^AW-\d+\/[A-Za-z0-9_-]+$/;
  actionIds.forEach((id, index) => {
    if (id && actionPattern.test(id)) {
      console.log(`✅ Conversion action ${index + 1} format is valid`);
    } else if (id) {
      console.log(`❌ Conversion action ${index + 1} format is invalid: ${id}`);
      console.log('   Expected format: AW-XXXXXXXXX/CONVERSION_LABEL');
    }
  });
}

// Check component implementation
console.log('\n📋 3. Checking Component Implementation...\n');

const componentsToCheck = [
  {
    path: 'src/components/forms/UploadModal.tsx',
    functions: ['trackPhotoUpload', 'trackArtworkGeneration']
  },
  {
    path: 'src/app/artwork/[token]/page.tsx',
    functions: ['trackArtworkView']
  },
  {
    path: 'src/app/layout.tsx',
    functions: ['GoogleAdsTracking']
  }
];

componentsToCheck.forEach(({ path: filePath, functions }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    console.log(`\n📄 ${filePath}:`);
    functions.forEach(func => {
      if (content.includes(func)) {
        console.log(`   ✅ ${func} - FOUND`);
      } else {
        console.log(`   ❌ ${func} - NOT FOUND`);
      }
    });
  } else {
    console.log(`\n❌ ${filePath} - FILE NOT FOUND`);
  }
});

// Check for server-side tracking
console.log('\n📋 4. Checking Server-Side Tracking...\n');

const serverSideFile = path.join(__dirname, '..', 'src/lib/google-ads-server.ts');
if (fs.existsSync(serverSideFile)) {
  console.log('✅ Server-side tracking file exists: src/lib/google-ads-server.ts');
  
  // Check if it's integrated in webhook
  const webhookPath = path.join(__dirname, '..', 'src/app/api/webhook/route.ts');
  if (fs.existsSync(webhookPath)) {
    const webhookContent = fs.readFileSync(webhookPath, 'utf-8');
    if (webhookContent.includes('trackServerSideConversion') || webhookContent.includes('google-ads-server')) {
      console.log('✅ Server-side tracking is integrated in Stripe webhook');
    } else {
      console.log('⚠️  Server-side tracking NOT found in Stripe webhook');
    }
  }
} else {
  console.log('❌ Server-side tracking file not found');
  console.log('   Purchase conversions may not be tracked server-side');
}

// Common issues and recommendations
console.log('\n📋 5. Common Issues & Recommendations...\n');

console.log('🔧 If conversions are not tracking, check:');
console.log('');
console.log('1. ❓ Are the conversion actions created in Google Ads?');
console.log('   → Go to Google Ads → Tools → Conversions');
console.log('   → Create conversion actions for each event type');
console.log('   → Copy the conversion IDs to .env.local');
console.log('');
console.log('2. ❓ Is the Google Ads tag loading on the page?');
console.log('   → Open your site in a browser');
console.log('   → Open Developer Tools (F12) → Console');
console.log('   → Look for "Google Ads" messages');
console.log('   → Check Network tab for gtag/js requests');
console.log('');
console.log('3. ❓ Are you testing in production or with real traffic?');
console.log('   → Conversions may not show immediately (24-48 hours)');
console.log('   → Use Google Tag Assistant Chrome extension to verify');
console.log('   → Test with real purchases, not test mode');
console.log('');
console.log('4. ❓ Is your Google Ads campaign active?');
console.log('   → Check campaign status in Google Ads dashboard');
console.log('   → Ensure conversion tracking is enabled');
console.log('   → Verify attribution settings are correct');
console.log('');
console.log('5. ❓ Are there browser extensions blocking tracking?');
console.log('   → Ad blockers can prevent gtag from loading');
console.log('   → Test in incognito mode without extensions');
console.log('');

// Testing commands
console.log('\n📋 6. Testing Commands...\n');

console.log('To test conversion tracking manually:');
console.log('');
console.log('1. Open your site: https://pawpopart.com');
console.log('2. Open browser console (F12)');
console.log('3. Run this command to test photo upload:');
console.log('');
console.log('   gtag("event", "conversion", {');
console.log(`     send_to: "${envVars['NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID'] || 'YOUR_PHOTO_UPLOAD_ID'}",`);
console.log('     value: 2,');
console.log('     currency: "CAD"');
console.log('   });');
console.log('');
console.log('4. Check Google Ads → Conversions → Recent conversions');
console.log('   (May take 3-6 hours to appear)');
console.log('');

console.log('='.repeat(60));
console.log('\n✨ Diagnostic Complete!\n');

// Exit summary
const missingVars = envVars['NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID'] ? 0 : 1;
if (missingVars > 0) {
  console.log('❌ ACTION REQUIRED: Set up environment variables first!');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good! If still not tracking, check Google Ads setup.');
  process.exit(0);
}

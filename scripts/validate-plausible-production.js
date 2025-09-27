#!/usr/bin/env node

/**
 * Plausible Analytics Production Validation Script
 * 
 * Checks for common issues that could prevent Plausible from working in production:
 * - Domain configuration
 * - HTTPS requirements
 * - Environment variables
 * - A/B testing functionality
 * - Manual approval integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Plausible Analytics Production Setup...\n');

// Check 1: Environment Configuration
function checkEnvironmentConfig() {
  console.log('1. Environment Configuration:');
  
  const envExample = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExample)) {
    console.log('   ❌ .env.example not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envExample, 'utf8');
  
  // Check domain configuration
  if (envContent.includes('NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pawpopart.com')) {
    console.log('   ✅ Domain configured correctly');
  } else {
    console.log('   ❌ Domain not configured or incorrect');
  }
  
  // Check script URL
  if (envContent.includes('NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js')) {
    console.log('   ✅ Standard script URL configured');
  } else {
    console.log('   ⚠️  Non-standard script URL - may cause CORS issues');
  }
  
  console.log('');
  return true;
}

// Check 2: Component Integration
function checkComponentIntegration() {
  console.log('2. Component Integration:');
  
  // Check PlausibleScript component
  const scriptPath = path.join(process.cwd(), 'src/components/analytics/PlausibleScript.tsx');
  if (fs.existsSync(scriptPath)) {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    if (scriptContent.includes('beforeInteractive')) {
      console.log('   ✅ PlausibleScript uses beforeInteractive strategy');
    } else {
      console.log('   ⚠️  PlausibleScript may not initialize properly');
    }
    
    if (scriptContent.includes('window.plausible = window.plausible || function()')) {
      console.log('   ✅ Queue initialization present');
    } else {
      console.log('   ❌ Missing queue initialization');
    }
  } else {
    console.log('   ❌ PlausibleScript component not found');
  }
  
  // Check layout integration
  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    if (layoutContent.includes('PlausibleScript')) {
      console.log('   ✅ PlausibleScript integrated in layout');
    } else {
      console.log('   ❌ PlausibleScript not integrated in layout');
    }
  }
  
  console.log('');
}

// Check 3: A/B Testing Implementation
function checkABTesting() {
  console.log('3. A/B Testing Implementation:');
  
  const plausiblePath = path.join(process.cwd(), 'src/lib/plausible.ts');
  if (fs.existsSync(plausiblePath)) {
    const plausibleContent = fs.readFileSync(plausiblePath, 'utf8');
    
    if (plausibleContent.includes('isLocalStorageAvailable')) {
      console.log('   ✅ localStorage availability check present');
    } else {
      console.log('   ❌ Missing localStorage availability check');
    }
    
    if (plausibleContent.includes('PRICE_VARIANTS')) {
      console.log('   ✅ Price variants configured');
    } else {
      console.log('   ❌ Price variants not configured');
    }
    
    if (plausibleContent.includes('setTimeout')) {
      console.log('   ✅ Delayed tracking to prevent race conditions');
    } else {
      console.log('   ⚠️  No delayed tracking - may cause race conditions');
    }
  } else {
    console.log('   ❌ Plausible library not found');
  }
  
  console.log('');
}

// Check 4: Manual Approval Integration
function checkManualApprovalIntegration() {
  console.log('4. Manual Approval Integration:');
  
  const uploadModalPath = path.join(process.cwd(), 'src/components/forms/UploadModal.tsx');
  if (fs.existsSync(uploadModalPath)) {
    const uploadContent = fs.readFileSync(uploadModalPath, 'utf8');
    
    if (uploadContent.includes('isHumanReviewEnabled')) {
      console.log('   ✅ Manual approval check integrated');
    } else {
      console.log('   ❌ Manual approval check missing');
    }
    
    if (uploadContent.includes('Pending Approval')) {
      console.log('   ✅ Separate tracking for pending approval');
    } else {
      console.log('   ❌ No separate tracking for pending approval');
    }
  } else {
    console.log('   ❌ UploadModal component not found');
  }
  
  console.log('');
}

// Check 5: Production Readiness
function checkProductionReadiness() {
  console.log('5. Production Readiness Checklist:');
  
  console.log('   📋 Pre-deployment checklist:');
  console.log('      • Verify pawpopart.com is added to Plausible dashboard');
  console.log('      • Ensure HTTPS is enabled (required for Plausible)');
  console.log('      • Test A/B testing in incognito/private browsing');
  console.log('      • Verify tracking works with manual approval enabled/disabled');
  console.log('      • Check that events appear in Plausible dashboard');
  console.log('      • Test localStorage fallback in private browsing mode');
  console.log('');
  
  console.log('   🚨 Common Production Issues:');
  console.log('      • Ad blockers may block Plausible script');
  console.log('      • Private browsing disables localStorage');
  console.log('      • CORS issues if domain mismatch');
  console.log('      • Race conditions if script loads slowly');
  console.log('      • Manual approval may affect funnel metrics');
  console.log('');
}

// Run all checks
function runValidation() {
  checkEnvironmentConfig();
  checkComponentIntegration();
  checkABTesting();
  checkManualApprovalIntegration();
  checkProductionReadiness();
  
  console.log('✅ Validation complete! Review any warnings above before deploying.');
}

runValidation();

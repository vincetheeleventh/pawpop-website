#!/usr/bin/env node

/**
 * Monitor User Type Tracking for Google Ads Segmentation
 * 
 * This script verifies that user_type data is flowing correctly through the system:
 * 1. Checks artwork records for user_type field
 * 2. Verifies recent orders have associated user_type
 * 3. Simulates conversion tracking to verify parameter passing
 * 4. Provides recommendations for optimization
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

async function checkArtworkUserTypes() {
  section('📊 Checking Artwork Records for User Type Data');
  
  try {
    // Get recent artworks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select('id, customer_email, user_type, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      log(`❌ Error fetching artworks: ${error.message}`, 'red');
      return;
    }
    
    if (!artworks || artworks.length === 0) {
      log('⚠️  No artworks found in the last 30 days', 'yellow');
      return;
    }
    
    // Analyze user_type distribution
    const stats = {
      total: artworks.length,
      gifter: 0,
      self_purchaser: 0,
      unknown: 0,
      null: 0
    };
    
    artworks.forEach(artwork => {
      if (!artwork.user_type) {
        stats.null++;
      } else if (artwork.user_type === 'gifter') {
        stats.gifter++;
      } else if (artwork.user_type === 'self_purchaser') {
        stats.self_purchaser++;
      } else {
        stats.unknown++;
      }
    });
    
    log(`Total artworks (last 30 days): ${stats.total}`, 'cyan');
    log(`  ├─ Gifters: ${stats.gifter} (${((stats.gifter / stats.total) * 100).toFixed(1)}%)`, 'green');
    log(`  ├─ Self-Purchasers: ${stats.self_purchaser} (${((stats.self_purchaser / stats.total) * 100).toFixed(1)}%)`, 'green');
    log(`  ├─ Unknown: ${stats.unknown} (${((stats.unknown / stats.total) * 100).toFixed(1)}%)`, 'yellow');
    log(`  └─ Null (not set): ${stats.null} (${((stats.null / stats.total) * 100).toFixed(1)}%)`, 'red');
    
    // Recommendations
    if (stats.null > stats.total * 0.1) {
      log('\n⚠️  WARNING: More than 10% of artworks have null user_type', 'yellow');
      log('   → Check UploadModalEmailFirst component for proper user_type tracking', 'yellow');
    }
    
    if (stats.gifter + stats.self_purchaser > 0) {
      log('\n✅ User type tracking is working!', 'green');
    }
    
    return stats;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function checkOrderUserTypes() {
  section('🛒 Checking Orders for User Type Association');
  
  try {
    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        artwork_id,
        stripe_session_id,
        product_type,
        price_cents,
        created_at,
        artworks (
          user_type,
          customer_email
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      log(`❌ Error fetching orders: ${error.message}`, 'red');
      return;
    }
    
    if (!orders || orders.length === 0) {
      log('⚠️  No orders found in the last 30 days', 'yellow');
      return;
    }
    
    // Analyze order user_type distribution
    const stats = {
      total: orders.length,
      gifter: 0,
      self_purchaser: 0,
      unknown: 0,
      no_artwork: 0
    };
    
    let totalRevenue = {
      gifter: 0,
      self_purchaser: 0,
      unknown: 0
    };
    
    orders.forEach(order => {
      if (!order.artworks) {
        stats.no_artwork++;
      } else {
        const userType = order.artworks.user_type;
        const revenue = order.price_cents / 100;
        
        if (userType === 'gifter') {
          stats.gifter++;
          totalRevenue.gifter += revenue;
        } else if (userType === 'self_purchaser') {
          stats.self_purchaser++;
          totalRevenue.self_purchaser += revenue;
        } else {
          stats.unknown++;
          totalRevenue.unknown += revenue;
        }
      }
    });
    
    log(`Total orders (last 30 days): ${stats.total}`, 'cyan');
    log(`  ├─ Gifter orders: ${stats.gifter} (${((stats.gifter / stats.total) * 100).toFixed(1)}%)`, 'green');
    log(`  ├─ Self-Purchaser orders: ${stats.self_purchaser} (${((stats.self_purchaser / stats.total) * 100).toFixed(1)}%)`, 'green');
    log(`  ├─ Unknown type: ${stats.unknown} (${((stats.unknown / stats.total) * 100).toFixed(1)}%)`, 'yellow');
    log(`  └─ No artwork link: ${stats.no_artwork} (${((stats.no_artwork / stats.total) * 100).toFixed(1)}%)`, 'red');
    
    // Revenue analysis
    if (stats.gifter > 0 || stats.self_purchaser > 0) {
      log('\n💰 Revenue Analysis:', 'cyan');
      
      if (stats.gifter > 0) {
        const avgGifter = totalRevenue.gifter / stats.gifter;
        log(`  ├─ Gifter revenue: $${totalRevenue.gifter.toFixed(2)} CAD (avg: $${avgGifter.toFixed(2)})`, 'green');
      }
      
      if (stats.self_purchaser > 0) {
        const avgSelfPurchaser = totalRevenue.self_purchaser / stats.self_purchaser;
        log(`  └─ Self-Purchaser revenue: $${totalRevenue.self_purchaser.toFixed(2)} CAD (avg: $${avgSelfPurchaser.toFixed(2)})`, 'green');
      }
      
      // Compare AOV
      if (stats.gifter > 0 && stats.self_purchaser > 0) {
        const gifterAOV = totalRevenue.gifter / stats.gifter;
        const selfPurchaserAOV = totalRevenue.self_purchaser / stats.self_purchaser;
        const diff = ((gifterAOV - selfPurchaserAOV) / selfPurchaserAOV * 100).toFixed(1);
        
        log('\n📊 Average Order Value (AOV) Comparison:', 'cyan');
        if (gifterAOV > selfPurchaserAOV) {
          log(`  → Gifters spend ${diff}% MORE than self-purchasers`, 'green');
          log(`  → Consider focusing marketing on gift-giving occasions`, 'blue');
        } else {
          log(`  → Self-purchasers spend ${Math.abs(diff)}% MORE than gifters`, 'green');
          log(`  → Consider emphasizing personal pet art ownership`, 'blue');
        }
      }
    }
    
    return stats;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

function simulateConversionTracking() {
  section('🎯 Simulating Conversion Tracking');
  
  log('Client-Side Tracking Example:', 'cyan');
  console.log(`
trackPurchase(
  'cs_test_123',           // orderId
  79.99,                   // value
  'framed_canvas',         // productType
  'CAD',                   // currency
  { email: 'user@example.com' }, // userData
  'gifter'                 // userType ← Custom parameter
);
  `);
  
  log('Expected gtag event:', 'cyan');
  console.log(`
gtag('event', 'conversion', {
  send_to: 'AW-939186815/PURCHASE_LABEL',
  value: 79.99,
  currency: 'CAD',
  transaction_id: 'cs_test_123',
  custom_parameters: {
    event_category: 'ecommerce',
    event_label: 'purchase_completed',
    product_type: 'framed_canvas',
    user_type: 'gifter'  ← Will be used for segmentation
  }
});
  `);
  
  log('\nServer-Side Tracking Example:', 'cyan');
  console.log(`
// Webhook fetches artwork
const artwork = await getArtworkById(metadata.artworkId);
const userType = artwork?.user_type; // 'gifter' | 'self_purchaser'

// Passes to Google Ads
trackServerSideConversion({
  orderId: session.id,
  value: 79.99,
  currency: 'CAD',
  productType: 'framed_canvas',
  userType: userType,  ← Included in conversion data
  customParameters: { ... }
});
  `);
}

function provideRecommendations(artworkStats, orderStats) {
  section('💡 Recommendations');
  
  if (!artworkStats || !orderStats) {
    log('⚠️  Insufficient data for recommendations', 'yellow');
    return;
  }
  
  const recommendations = [];
  
  // Check data quality
  if (artworkStats.null > artworkStats.total * 0.1) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'More than 10% of artworks have null user_type',
      action: 'Review UploadModalEmailFirst component to ensure user_type is being captured and saved'
    });
  }
  
  if (orderStats.no_artwork > orderStats.total * 0.05) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Some orders are not linked to artwork records',
      action: 'Verify artwork_id is being passed correctly in Stripe checkout metadata'
    });
  }
  
  // Check tracking setup
  if (artworkStats.gifter + artworkStats.self_purchaser > 0) {
    recommendations.push({
      priority: 'INFO',
      issue: 'User type tracking is working',
      action: 'Set up custom segments in Google Ads UI (see documentation)'
    });
  }
  
  // Data analysis recommendations
  if (orderStats.gifter > 5 && orderStats.self_purchaser > 5) {
    recommendations.push({
      priority: 'INFO',
      issue: 'Sufficient data for segmentation analysis',
      action: 'Create custom columns in Google Ads to compare conversion rates and AOV by user type'
    });
  } else {
    recommendations.push({
      priority: 'INFO',
      issue: 'Limited data for segmentation analysis',
      action: 'Wait for more conversions before drawing conclusions (recommended: 20+ per segment)'
    });
  }
  
  // Display recommendations
  recommendations.forEach((rec, index) => {
    const color = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'green';
    log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`, color);
    log(`   → ${rec.action}`, 'cyan');
  });
}

function displayNextSteps() {
  section('🚀 Next Steps');
  
  log('1. Set up custom segments in Google Ads UI', 'cyan');
  log('   → See: docs/marketing/GOOGLE_ADS_USER_TYPE_SEGMENTATION.md', 'blue');
  
  log('\n2. Create custom columns for analysis', 'cyan');
  log('   → Gifter Conversions, Gifter Value', 'blue');
  log('   → Self-Purchaser Conversions, Self-Purchaser Value', 'blue');
  
  log('\n3. Monitor data collection (24-48 hours)', 'cyan');
  log('   → Check Google Ads > Conversions > Segments', 'blue');
  log('   → Look for user_type parameter with values', 'blue');
  
  log('\n4. Analyze results and optimize', 'cyan');
  log('   → Compare conversion rates by user type', 'blue');
  log('   → Identify high-value segments', 'blue');
  log('   → Adjust marketing strategy accordingly', 'blue');
}

// Main execution
async function main() {
  log('\n🔍 PawPop User Type Tracking Monitor', 'bright');
  log('Verifying user_type data flow for Google Ads segmentation\n', 'cyan');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing required environment variables', 'red');
    log('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set', 'yellow');
    process.exit(1);
  }
  
  // Run checks
  const artworkStats = await checkArtworkUserTypes();
  const orderStats = await checkOrderUserTypes();
  
  // Simulate tracking
  simulateConversionTracking();
  
  // Provide recommendations
  provideRecommendations(artworkStats, orderStats);
  
  // Display next steps
  displayNextSteps();
  
  log('\n✅ Monitoring complete!\n', 'green');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

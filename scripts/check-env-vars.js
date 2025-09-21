// Check environment variables for debugging
console.log('🔍 Environment Variables Check:');
console.log('');

// Stripe
console.log('💳 Stripe Configuration:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

// Supabase
console.log('🗄️ Supabase Configuration:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Printify
console.log('🖨️ Printify Configuration:');
console.log('PRINTIFY_API_TOKEN:', process.env.PRINTIFY_API_TOKEN ? '✅ Set' : '❌ Missing');
console.log('PRINTIFY_SHOP_ID:', process.env.PRINTIFY_SHOP_ID ? '✅ Set' : '❌ Missing');
console.log('PRINTIFY_WEBHOOK_SECRET:', process.env.PRINTIFY_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

// Other
console.log('🌐 Other Configuration:');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('');

// Test imports
console.log('📦 Testing imports:');
try {
  const { stripe } = require('../src/lib/stripe');
  console.log('Stripe client:', stripe ? '✅ Available' : '❌ Not available');
} catch (error) {
  console.log('Stripe import error:', error.message);
}

try {
  const { supabaseAdmin } = require('../src/lib/supabase');
  console.log('Supabase admin:', supabaseAdmin ? '✅ Available' : '❌ Not available');
} catch (error) {
  console.log('Supabase import error:', error.message);
}

try {
  const { getProductPricing } = require('../src/lib/printify-products');
  const testPrice = getProductPricing('art_print', '16x24', 'US', false);
  console.log('Product pricing test:', testPrice ? `✅ ${testPrice} cents` : '❌ Failed');
} catch (error) {
  console.log('Product pricing error:', error.message);
}

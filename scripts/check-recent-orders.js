#!/usr/bin/env node

/**
 * Check recent orders in database to see if Printify orders were created
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentOrders() {
  console.log('🔍 CHECKING RECENT ORDERS FOR PRINTIFY INTEGRATION\n');

  try {
    // Get recent test orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .ilike('stripe_session_id', '%printify_test%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return false;
    }

    console.log('📦 RECENT TEST ORDERS:');
    console.log('=' .repeat(80));

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order: ${order.stripe_session_id}`);
        console.log(`   Status: ${order.order_status}`);
        console.log(`   Product: ${order.product_type} (${order.product_size})`);
        console.log(`   Printify Order ID: ${order.printify_order_id || 'NOT SET'}`);
        console.log(`   Printify Status: ${order.printify_status || 'NOT SET'}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(order.updated_at).toLocaleString()}`);
      });

      // Check for successful Printify orders
      const successfulOrders = orders.filter(order => order.printify_order_id);
      
      if (successfulOrders.length > 0) {
        console.log(`\n🎉 SUCCESS! Found ${successfulOrders.length} orders with Printify Order IDs:`);
        successfulOrders.forEach(order => {
          console.log(`   ✅ ${order.stripe_session_id} → Printify Order: ${order.printify_order_id}`);
        });
        
        console.log('\n📋 CHECK YOUR PRINTIFY DASHBOARD:');
        console.log('   1. Go to https://printify.com/app/orders');
        console.log('   2. Look for these Printify Order IDs:');
        successfulOrders.forEach(order => {
          console.log(`      - ${order.printify_order_id}`);
        });
        
        return true;
      } else {
        console.log('\n⚠️  No orders with Printify Order IDs found yet');
        console.log('   This could mean:');
        console.log('   - Orders are still processing (Printify API can be slow)');
        console.log('   - There was an error in the Printify order creation');
        console.log('   - The integration needs more time to complete');
      }
    } else {
      console.log('No test orders found');
    }

    // Check order status history for more details
    console.log('\n📜 RECENT ORDER STATUS HISTORY:');
    console.log('=' .repeat(80));

    const { data: history, error: historyError } = await supabase
      .from('order_status_history')
      .select(`
        *,
        orders!inner(stripe_session_id, product_type, product_size)
      `)
      .ilike('orders.stripe_session_id', '%printify_test%')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!historyError && history) {
      history.forEach((entry, index) => {
        console.log(`\n${index + 1}. ${entry.orders.stripe_session_id}`);
        console.log(`   Status: ${entry.status}`);
        console.log(`   Notes: ${entry.notes || 'No notes'}`);
        console.log(`   Time: ${new Date(entry.created_at).toLocaleString()}`);
      });
    }

    return false;

  } catch (error) {
    console.error('💥 Error checking orders:', error);
    return false;
  }
}

// Run the check
checkRecentOrders()
  .then((success) => {
    if (success) {
      console.log('\n🎉 PRINTIFY INTEGRATION SUCCESSFUL!');
      console.log('   Real Printify orders have been created in your dashboard.');
    } else {
      console.log('\n⏳ PRINTIFY INTEGRATION IN PROGRESS');
      console.log('   Check again in a few minutes or check your Printify dashboard directly.');
    }
    console.log(`\n✨ Check completed: ${success ? '✅ ORDERS FOUND' : '⏳ STILL PROCESSING'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Check crashed:', error);
    process.exit(1);
  });

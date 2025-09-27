#!/usr/bin/env node

/**
 * Manually fix the order status constraint by directly executing SQL
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

async function manualConstraintFix() {
  console.log('🔧 MANUALLY FIXING ORDER STATUS CONSTRAINT\n');

  try {
    // Step 1: Drop the existing constraint
    console.log('1️⃣ Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;'
    });

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return false;
    }
    console.log('✅ Existing constraint dropped');

    // Step 2: Add the new constraint with pending_review
    console.log('\n2️⃣ Adding new constraint with pending_review...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
        CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'pending_review'));
      `
    });

    if (addError) {
      console.error('❌ Error adding constraint:', addError);
      return false;
    }
    console.log('✅ New constraint added with pending_review');

    // Step 3: Test the constraint
    console.log('\n3️⃣ Testing the constraint...');
    const testOrderData = {
      artwork_id: '00000000-0000-0000-0000-000000000000',
      stripe_session_id: `cs_test_manual_${Date.now()}`,
      stripe_payment_intent_id: `pi_test_manual_${Date.now()}`,
      customer_email: 'test@manual.com',
      customer_name: 'Manual Test',
      product_type: 'framed_canvas',
      product_size: '16x20',
      price_cents: 7999,
      order_status: 'pending_review'
    };

    const { error: testError } = await supabase
      .from('orders')
      .insert(testOrderData);

    if (testError) {
      if (testError.code === '23503') {
        console.log('✅ Constraint test PASSED (FK error expected)');
        console.log('   pending_review status is now allowed!');
        return true;
      } else if (testError.code === '23514') {
        console.log('❌ Constraint test FAILED');
        console.log(`   Check constraint error: ${testError.message}`);
        return false;
      } else {
        console.log(`⚠️  Unexpected test error: ${testError.code} - ${testError.message}`);
        return false;
      }
    } else {
      // Clean up test record
      await supabase
        .from('orders')
        .delete()
        .eq('stripe_payment_intent_id', testOrderData.stripe_payment_intent_id);
      console.log('✅ Constraint test PASSED (test record created and cleaned up)');
      return true;
    }

  } catch (error) {
    console.error('💥 Manual fix failed:', error);
    return false;
  }
}

// Run the manual fix
manualConstraintFix()
  .then((success) => {
    if (success) {
      console.log('\n🎉 CONSTRAINT FIX SUCCESSFUL!');
      console.log('   ✅ pending_review status is now allowed in orders table');
      console.log('   ✅ Manual approval workflow can proceed');
    } else {
      console.log('\n❌ CONSTRAINT FIX FAILED');
      console.log('   Manual intervention may be required');
    }
    console.log(`\n✨ Manual fix result: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Manual fix crashed:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Check the current order_status constraint to see if pending_review is already allowed
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

async function checkOrderStatusConstraint() {
  console.log('🔍 CHECKING ORDER STATUS CONSTRAINT\n');

  try {
    // Get the current constraint definition
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'orders' 
        AND tc.constraint_type = 'CHECK'
        AND tc.constraint_name LIKE '%status%';
      `
    });

    if (constraintError) {
      console.error('❌ Error getting constraints:', constraintError);
      return false;
    }

    console.log('🔒 CURRENT ORDER STATUS CONSTRAINTS:');
    console.log('=' .repeat(80));
    
    if (constraints && Array.isArray(constraints)) {
      constraints.forEach(constraint => {
        console.log(`Name: ${constraint.constraint_name}`);
        console.log(`Type: ${constraint.constraint_type}`);
        console.log(`Check Clause: ${constraint.check_clause || 'N/A'}`);
        console.log('-'.repeat(40));
        
        // Check if pending_review is already allowed
        if (constraint.check_clause && constraint.check_clause.includes('pending_review')) {
          console.log('✅ pending_review is ALREADY ALLOWED in this constraint');
        } else if (constraint.check_clause) {
          console.log('❌ pending_review is NOT ALLOWED in this constraint');
        }
        console.log('');
      });
    } else {
      console.log('No status-related constraints found');
    }

    // Test if we can actually use pending_review status
    console.log('🧪 TESTING pending_review STATUS:');
    console.log('=' .repeat(80));
    
    const testOrderData = {
      artwork_id: '00000000-0000-0000-0000-000000000000', // This will fail FK constraint but that's OK
      stripe_session_id: `cs_test_status_${Date.now()}`,
      stripe_payment_intent_id: `pi_test_status_${Date.now()}`,
      customer_email: 'test@status.com',
      customer_name: 'Test User',
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
        console.log('✅ pending_review status is ALLOWED (FK constraint error expected)');
        console.log('   The status constraint passed, only foreign key failed');
        return true;
      } else if (testError.code === '23514') {
        console.log('❌ pending_review status is NOT ALLOWED');
        console.log(`   Check constraint error: ${testError.message}`);
        return false;
      } else {
        console.log(`⚠️  Unexpected error: ${testError.code} - ${testError.message}`);
        return false;
      }
    } else {
      // Unexpected success - clean up
      await supabase
        .from('orders')
        .delete()
        .eq('stripe_payment_intent_id', testOrderData.stripe_payment_intent_id);
      console.log('✅ pending_review status is ALLOWED (test record created and cleaned up)');
      return true;
    }

  } catch (error) {
    console.error('💥 Constraint check failed:', error);
    return false;
  }
}

// Run the constraint check
checkOrderStatusConstraint()
  .then((success) => {
    console.log(`\n✨ Constraint check: ${success ? '✅ pending_review ALLOWED' : '❌ pending_review NOT ALLOWED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Constraint check crashed:', error);
    process.exit(1);
  });

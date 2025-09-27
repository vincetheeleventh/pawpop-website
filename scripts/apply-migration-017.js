#!/usr/bin/env node

/**
 * Apply migration 017 to add pending_review status to orders table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 APPLYING MIGRATION 017: Add pending_review status to orders table\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '017_add_pending_review_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('');

    // Execute the migration
    console.log('🚀 Executing migration...');
    
    // Split the SQL into individual statements (excluding BEGIN/COMMIT)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.toLowerCase().includes('begin') && !s.toLowerCase().includes('commit'))
      .filter(s => !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('✅ Migration 017 applied successfully!');
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration...');
    
    // Try to create a test order with pending_review status
    const testOrderData = {
      artwork_id: '00000000-0000-0000-0000-000000000000', // This will fail FK constraint but that's OK
      stripe_payment_intent_id: `pi_test_migration_${Date.now()}`,
      customer_email: 'test@migration.com',
      product_type: 'framed_canvas',
      amount_total: 7999,
      order_status: 'pending_review' // This should now be allowed
    };

    const { error: testError } = await supabase
      .from('orders')
      .insert(testOrderData);

    if (testError && testError.code === '23503') {
      // Foreign key constraint error is expected and OK - means status constraint passed
      console.log('✅ Status constraint verification passed (FK error expected)');
    } else if (testError && testError.code === '23514') {
      // Check constraint error means our migration didn't work
      console.error('❌ Status constraint still failing:', testError.message);
      return false;
    } else if (!testError) {
      // Unexpected success - clean up the test record
      await supabase
        .from('orders')
        .delete()
        .eq('stripe_payment_intent_id', testOrderData.stripe_payment_intent_id);
      console.log('✅ Status constraint verification passed');
    }

    console.log('\n🎉 Migration 017 completed successfully!');
    console.log('   ✅ pending_review status is now allowed in orders table');
    console.log('   ✅ Manual approval workflow can now update order status correctly');
    
    return true;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return false;
  }
}

// Run the migration
applyMigration()
  .then((success) => {
    console.log(`\n✨ Migration result: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Migration crashed:', error);
    process.exit(1);
  });

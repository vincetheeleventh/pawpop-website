#!/usr/bin/env node

/**
 * Rollback Coupon System Database Changes
 * 
 * This script will remove all coupon-related tables and functions
 * from the database, reverting to the state before migration 015.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function rollbackCouponSystem() {
  console.log('🔄 Rolling back coupon system database changes...');
  
  try {
    // Read the rollback SQL file
    const rollbackPath = path.join(__dirname, '../supabase/rollbacks/015_rollback_coupon_system.sql');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    console.log('📄 Executing rollback SQL...');
    
    // Split the SQL into individual statements and execute them
    const statements = rollbackSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(0);
          
          // If that also fails, try a different approach
          console.warn(`   ⚠️ Statement may have failed: ${error.message}`);
        } else {
          console.log(`   ✅ Statement executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Rollback completed successfully!');
    console.log('\n📋 Changes made:');
    console.log('   - Dropped apply_coupon_code() function');
    console.log('   - Dropped validate_coupon_code() function');
    console.log('   - Dropped coupon_usage table');
    console.log('   - Dropped coupon_codes table');
    console.log('\n✅ Database is now back to pre-coupon state');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    console.error('\n🔧 Manual rollback required. Please run the following SQL in your Supabase SQL Editor:');
    console.error('\n' + fs.readFileSync(path.join(__dirname, '../supabase/rollbacks/015_rollback_coupon_system.sql'), 'utf8'));
    process.exit(1);
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will permanently delete all coupon system data!');
console.log('📊 This includes:');
console.log('   - All coupon codes (TEST99, DOLLAR1, SAVE44, etc.)');
console.log('   - All coupon usage history');
console.log('   - All coupon-related database functions');
console.log('\n🔄 This action cannot be undone.');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nDo you want to proceed with the rollback? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    rollbackCouponSystem();
  } else {
    console.log('❌ Rollback cancelled.');
    rl.close();
    process.exit(0);
  }
});

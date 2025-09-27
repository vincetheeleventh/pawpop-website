#!/usr/bin/env node

/**
 * Check the current orders table schema
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

async function checkOrdersSchema() {
  console.log('🔍 CHECKING ORDERS TABLE SCHEMA\n');

  try {
    // Get table schema information
    const { data: columns, error: schemaError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        ORDER BY ordinal_position;
      `
    });

    if (schemaError) {
      console.error('❌ Error getting schema:', schemaError);
      return false;
    }

    console.log('📊 ORDERS TABLE COLUMNS:');
    console.log('=' .repeat(80));
    console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default');
    console.log('-'.repeat(80));
    
    if (columns && Array.isArray(columns)) {
      columns.forEach(col => {
        console.log(
          col.column_name.padEnd(25) + 
          col.data_type.padEnd(20) + 
          col.is_nullable.padEnd(10) + 
          (col.column_default || 'NULL')
        );
      });
    }

    // Check for constraints
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          constraint_name,
          constraint_type,
          check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'orders' AND tc.constraint_type = 'CHECK';
      `
    });

    if (!constraintError && constraints) {
      console.log('\n🔒 CHECK CONSTRAINTS:');
      console.log('=' .repeat(80));
      constraints.forEach(constraint => {
        console.log(`Name: ${constraint.constraint_name}`);
        console.log(`Type: ${constraint.constraint_type}`);
        console.log(`Clause: ${constraint.check_clause || 'N/A'}`);
        console.log('-'.repeat(40));
      });
    }

    // Try to get a sample record to see actual column names
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (!sampleError && sampleOrder && sampleOrder.length > 0) {
      console.log('\n📋 SAMPLE ORDER RECORD STRUCTURE:');
      console.log('=' .repeat(80));
      console.log('Available columns:', Object.keys(sampleOrder[0]).join(', '));
    } else {
      console.log('\n📋 No sample orders found or error:', sampleError?.message);
    }

    return true;

  } catch (error) {
    console.error('💥 Schema check failed:', error);
    return false;
  }
}

// Run the schema check
checkOrdersSchema()
  .then((success) => {
    console.log(`\n✨ Schema check: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Schema check crashed:', error);
    process.exit(1);
  });

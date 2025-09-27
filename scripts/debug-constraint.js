#!/usr/bin/env node

/**
 * Debug the current constraint definition
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

async function debugConstraint() {
  console.log('🔍 DEBUGGING ORDER STATUS CONSTRAINT\n');

  try {
    // Get ALL constraints on the orders table
    const { data: allConstraints, error: allError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          cc.check_clause,
          tc.table_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'orders'
        ORDER BY tc.constraint_type, tc.constraint_name;
      `
    });

    if (allError) {
      console.error('❌ Error getting all constraints:', allError);
      return false;
    }

    console.log('🔒 ALL CONSTRAINTS ON ORDERS TABLE:');
    console.log('=' .repeat(80));
    
    if (allConstraints && Array.isArray(allConstraints)) {
      allConstraints.forEach(constraint => {
        console.log(`Name: ${constraint.constraint_name}`);
        console.log(`Type: ${constraint.constraint_type}`);
        console.log(`Check Clause: ${constraint.check_clause || 'N/A'}`);
        console.log('-'.repeat(40));
      });
    }

    // Try to get the specific constraint we're looking for
    const { data: statusConstraints, error: statusError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND contype = 'c'
        AND conname LIKE '%status%';
      `
    });

    if (!statusError && statusConstraints) {
      console.log('\n🔍 STATUS-RELATED CONSTRAINTS (PostgreSQL system view):');
      console.log('=' .repeat(80));
      statusConstraints.forEach(constraint => {
        console.log(`Name: ${constraint.constraint_name}`);
        console.log(`Definition: ${constraint.constraint_definition}`);
        console.log('-'.repeat(40));
      });
    }

    // Check schema version to see if our migration was recorded
    const { data: schemaVersions, error: versionError } = await supabase
      .from('schema_version')
      .select('*')
      .order('applied_at', { ascending: false })
      .limit(5);

    if (!versionError && schemaVersions) {
      console.log('\n📋 RECENT SCHEMA VERSIONS:');
      console.log('=' .repeat(80));
      schemaVersions.forEach(version => {
        console.log(`Version: ${version.version}`);
        console.log(`Description: ${version.description}`);
        console.log(`Applied: ${version.applied_at}`);
        console.log(`By: ${version.applied_by}`);
        console.log('-'.repeat(40));
      });
    }

    return true;

  } catch (error) {
    console.error('💥 Debug failed:', error);
    return false;
  }
}

// Run the debug
debugConstraint()
  .then((success) => {
    console.log(`\n✨ Debug completed: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Debug crashed:', error);
    process.exit(1);
  });

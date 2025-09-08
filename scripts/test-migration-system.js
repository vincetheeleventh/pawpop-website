#!/usr/bin/env node

/**
 * PawPop Migration System Test Script
 * Validates the complete migration workflow
 */

const { MigrationManager } = require('./migration-manager');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

async function testMigrationSystem() {
  console.log('🧪 Testing PawPop Migration System\n');
  
  try {
    // Initialize migration manager
    const manager = new MigrationManager('development');
    
    // Test 1: Check database connectivity
    console.log('1️⃣ Testing database connectivity...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.from('schema_version').select('*').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    console.log('✅ Database connectivity OK\n');
    
    // Test 2: Check migration functions exist
    console.log('2️⃣ Testing migration functions...');
    try {
      const { data: versionData, error: versionError } = await supabase.rpc('get_schema_version');
      if (versionError) {
        console.log('❌ Migration functions not found. Please run setup script first.');
        console.log('📋 Run this in Supabase SQL Editor:');
        console.log('   cat scripts/setup-database.sql');
        return false;
      }
      console.log(`✅ Migration functions OK (current version: ${versionData})\n`);
    } catch (error) {
      console.log('❌ Migration functions test failed:', error.message);
      return false;
    }
    
    // Test 3: List migration status
    console.log('3️⃣ Testing migration status...');
    await manager.listMigrations();
    console.log('✅ Migration status OK\n');
    
    // Test 4: Health check
    console.log('4️⃣ Testing health check...');
    const healthy = await manager.validateHealth();
    if (!healthy) {
      console.log('❌ Health check failed');
      return false;
    }
    console.log('✅ Health check OK\n');
    
    // Test 5: Create test migration
    console.log('5️⃣ Testing migration creation...');
    const testMigration = manager.createMigration('test migration system');
    console.log('✅ Migration creation OK\n');
    
    console.log('🎉 All tests passed! Migration system is ready to use.\n');
    
    console.log('📋 Next Steps:');
    console.log('1. Run setup script in Supabase SQL Editor if functions are missing');
    console.log('2. Apply initial migration: npm run migration:apply 001_initial_schema.sql');
    console.log('3. Check status: npm run migration:status');
    console.log('4. Create new migrations: npm run migration:create "description"');
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration system test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    console.log('- Run setup script in Supabase SQL Editor');
    console.log('- Check database connectivity');
    return false;
  }
}

if (require.main === module) {
  testMigrationSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testMigrationSystem };

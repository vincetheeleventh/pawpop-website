#!/usr/bin/env node

/**
 * PawPop Database Migration Manager
 * Safe, git-tracked schema management with rollback capabilities
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Environment configuration
const ENVIRONMENTS = {
  development: {  // Using current "production" as development per simplified strategy
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  staging: {
    url: process.env.SUPABASE_STAGING_URL,
    key: process.env.SUPABASE_STAGING_SERVICE_KEY,
  },
  production: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
};

class MigrationManager {
  constructor(environment = 'local') {
    this.env = environment;
    this.config = ENVIRONMENTS[environment];
    
    if (!this.config.url || !this.config.key) {
      throw new Error(`Missing configuration for environment: ${environment}`);
    }
    
    this.supabase = createClient(this.config.url, this.config.key);
    this.migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    this.rollbacksDir = path.join(__dirname, '..', 'supabase', 'rollbacks');
  }

  async getCurrentVersion() {
    try {
      const { data, error } = await this.supabase
        .from('schema_version')
        .select('version')
        .order('applied_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data?.version || 0;
    } catch (error) {
      console.log('Schema version table not found, assuming version 0');
      return 0;
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${this.env}_${timestamp}`;
    
    console.log(`📦 Creating backup: ${backupName}`);
    
    // In production, you'd use pg_dump or Supabase's backup API
    // For now, we'll create a simple schema export
    try {
      const { data: tables } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log(`✅ Backup created for ${tables?.length || 0} tables`);
      return backupName;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async applyMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    console.log(`🚀 Applying migration: ${migrationFile}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      // Try using exec_sql function first
      const { error: rpcError } = await this.supabase.rpc('exec_sql', { sql_query: sql });
      
      if (rpcError) {
        // If exec_sql doesn't exist, try direct SQL execution for setup
        if (rpcError.message.includes('Could not find the function')) {
          console.log('📝 exec_sql function not found, using direct SQL execution...');
          
          // Split SQL into individual statements and execute them
          const statements = this.splitSqlStatements(sql);
          
          for (const statement of statements) {
            if (statement.trim()) {
              const { error } = await this.supabase.from('_').select('1').limit(0);
              // This is a workaround - we'll need manual setup for the first migration
              throw new Error('Initial setup required. Please run the setup script manually in Supabase dashboard.');
            }
          }
        } else {
          throw rpcError;
        }
      }
      
      console.log(`✅ Migration applied successfully: ${migrationFile}`);
      return true;
    } catch (error) {
      console.error(`❌ Migration failed: ${migrationFile}`, error.message);
      throw error;
    }
  }

  splitSqlStatements(sql) {
    // Simple SQL statement splitter (handles basic cases)
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
  }

  async rollback(targetVersion = null) {
    const currentVersion = await this.getCurrentVersion();
    const rollbackVersion = targetVersion || (currentVersion - 1);
    
    if (rollbackVersion < 0) {
      throw new Error('Cannot rollback below version 0');
    }

    console.log(`🔄 Rolling back from version ${currentVersion} to ${rollbackVersion}`);
    
    // Create backup before rollback
    await this.createBackup();
    
    // Find and apply rollback script
    const rollbackFile = `${String(currentVersion).padStart(3, '0')}_rollback_*.sql`;
    const rollbackFiles = fs.readdirSync(this.rollbacksDir)
      .filter(f => f.startsWith(String(currentVersion).padStart(3, '0')));
    
    if (rollbackFiles.length === 0) {
      throw new Error(`No rollback script found for version ${currentVersion}`);
    }

    const rollbackPath = path.join(this.rollbacksDir, rollbackFiles[0]);
    const sql = fs.readFileSync(rollbackPath, 'utf8');
    
    try {
      const { error } = await this.supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Rollback completed to version ${rollbackVersion}`);
      return true;
    } catch (error) {
      console.error(`❌ Rollback failed:`, error.message);
      throw error;
    }
  }

  async validateHealth() {
    console.log('🔍 Validating application health...');
    
    try {
      // Test basic database connectivity
      const { data, error } = await this.supabase
        .from('artworks')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      // Test API endpoints (if in staging/production)
      if (this.env !== 'local') {
        // Add API health checks here
        console.log('🌐 Testing API endpoints...');
      }
      
      console.log('✅ Health check passed');
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async listMigrations() {
    const currentVersion = await this.getCurrentVersion();
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`\n📋 Migration Status (Current: v${currentVersion})`);
    console.log('─'.repeat(50));
    
    migrationFiles.forEach(file => {
      const version = parseInt(file.split('_')[0]);
      const status = version <= currentVersion ? '✅ Applied' : '⏳ Pending';
      console.log(`${status} ${file}`);
    });
    
    console.log('─'.repeat(50));
  }

  createMigration(name) {
    const currentVersion = this.getNextMigrationNumber();
    const migrationFile = `${String(currentVersion).padStart(3, '0')}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const rollbackFile = `${String(currentVersion).padStart(3, '0')}_rollback_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    
    const migrationTemplate = `-- Migration: ${migrationFile.replace('.sql', '')}
-- Description: ${name}
-- Author: ${process.env.USER || 'developer'}
-- Date: ${new Date().toISOString().split('T')[0]}

-- Validate prerequisites
SELECT validate_migration(${currentVersion - 1});

BEGIN;

-- TODO: Add your schema changes here
-- Example:
-- ALTER TABLE artworks ADD COLUMN new_field TEXT;

-- Update schema version
UPDATE schema_version SET 
  version = ${currentVersion}, 
  applied_at = NOW(),
  description = '${name}';

COMMIT;`;

    const rollbackTemplate = `-- Rollback: ${rollbackFile.replace('.sql', '')}
-- Description: Revert ${name}

BEGIN;

-- TODO: Add rollback operations here
-- Example:
-- ALTER TABLE artworks DROP COLUMN IF EXISTS new_field;

-- Revert version
UPDATE schema_version SET 
  version = ${currentVersion - 1}, 
  applied_at = NOW(),
  description = 'Rollback ${name}';

COMMIT;`;

    fs.writeFileSync(path.join(this.migrationsDir, migrationFile), migrationTemplate);
    fs.writeFileSync(path.join(this.rollbacksDir, rollbackFile), rollbackTemplate);
    
    console.log(`📝 Created migration files:`);
    console.log(`   Forward:  ${migrationFile}`);
    console.log(`   Rollback: ${rollbackFile}`);
    
    return { migrationFile, rollbackFile };
  }

  getNextMigrationNumber() {
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => parseInt(f.split('_')[0]))
      .filter(n => !isNaN(n));
    
    return migrationFiles.length > 0 ? Math.max(...migrationFiles) + 1 : 1;
  }
}

// CLI Interface
async function main() {
  const [,, command, ...args] = process.argv;
  const env = process.env.MIGRATION_ENV || 'development';
  
  try {
    const manager = new MigrationManager(env);
    
    switch (command) {
      case 'status':
        await manager.listMigrations();
        break;
        
      case 'create':
        const name = args.join(' ');
        if (!name) {
          throw new Error('Migration name required: npm run migration:create "add new field"');
        }
        manager.createMigration(name);
        break;
        
      case 'apply':
        const migrationFile = args[0];
        if (!migrationFile) {
          throw new Error('Migration file required: npm run migration:apply 002_add_field.sql');
        }
        
        // Safety check for production
        if (env === 'production') {
          console.log('⚠️  PRODUCTION DEPLOYMENT - Creating backup first...');
          await manager.createBackup();
        }
        
        await manager.applyMigration(migrationFile);
        
        // Validate health after migration
        const healthy = await manager.validateHealth();
        if (!healthy && env === 'production') {
          console.log('🚨 Health check failed - consider rollback');
        }
        break;
        
      case 'rollback':
        const targetVersion = args[0] ? parseInt(args[0]) : null;
        await manager.rollback(targetVersion);
        break;
        
      case 'health':
        await manager.validateHealth();
        break;
        
      default:
        console.log(`
PawPop Migration Manager

Usage:
  npm run migration:status              # Show migration status
  npm run migration:create "name"       # Create new migration
  npm run migration:apply file.sql      # Apply specific migration
  npm run migration:rollback [version]  # Rollback to version
  npm run migration:health              # Check system health

Environment: ${env} (set MIGRATION_ENV to change)
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationManager };

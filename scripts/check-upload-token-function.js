// Check if generate_upload_token function exists in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first, then .env
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunction() {
  console.log('🔍 Checking for generate_upload_token function...\n');

  // Try to call the function
  try {
    const { data, error } = await supabase.rpc('generate_upload_token');
    
    if (error) {
      console.error('❌ Function call failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === '42883') {
        console.log('\n💡 The function does not exist. You need to apply migration 018:');
        console.log('   Run: npm run supabase:migrate');
        console.log('   Or apply supabase/migrations/018_add_deferred_upload_tracking.sql manually');
      }
    } else {
      console.log('✅ Function exists and works! Generated token:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Check if upload_token column exists
  console.log('\n🔍 Checking if upload_token column exists...');
  const { data: artworks, error: queryError } = await supabase
    .from('artworks')
    .select('id, upload_token')
    .limit(1);

  if (queryError) {
    if (queryError.code === '42703') {
      console.error('❌ Column upload_token does not exist in artworks table');
      console.log('   You need to apply migration 018');
    } else {
      console.error('❌ Query failed:', queryError.message);
    }
  } else {
    console.log('✅ Column upload_token exists in artworks table');
  }
}

checkFunction();

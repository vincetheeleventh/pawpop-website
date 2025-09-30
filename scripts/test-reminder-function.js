// Test get_artworks_needing_reminders function
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunction() {
  console.log('🔍 Testing get_artworks_needing_reminders function...\n');

  try {
    const { data, error } = await supabase.rpc('get_artworks_needing_reminders', {
      hours_since_capture: 24,
      max_reminders: 3
    });

    if (error) {
      console.error('❌ Function call failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === 'PGRST202') {
        console.log('\n💡 The function does not exist. You need to apply migration 018.');
      }
    } else {
      console.log('✅ Function works!');
      console.log(`   Found ${data?.length || 0} artworks needing reminders`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Artworks:');
        data.forEach((artwork, i) => {
          console.log(`   ${i + 1}. ${artwork.customer_name} (${artwork.customer_email})`);
          console.log(`      Captured: ${artwork.email_captured_at}`);
          console.log(`      Reminders sent: ${artwork.upload_reminder_count}`);
        });
      } else {
        console.log('   No artworks need reminders at this time.');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testFunction();

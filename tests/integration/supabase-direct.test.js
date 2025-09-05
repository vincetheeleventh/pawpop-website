// Quick test of Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('artworks').select('count', { count: 'exact' })
    
    if (error) {
      console.error('Connection error:', error)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log('Artworks count:', data)
    
    // Test insert
    const { data: insertData, error: insertError } = await supabase
      .from('artworks')
      .insert({
        original_image_url: 'https://example.com/test.jpg',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        pet_name: 'Test Pet'
      })
      .select()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return
    }
    
    console.log('✅ Insert successful!')
    console.log('Created artwork:', insertData)
    
  } catch (err) {
    console.error('Test failed:', err)
  }
}

testConnection()

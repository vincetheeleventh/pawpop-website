// Quick test of Supabase connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nwqwtmudwbdkyjfyzlyg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cXd0bXVkd2Jka3lqZnl6bHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg0NTQ2NCwiZXhwIjoyMDcyNDIxNDY0fQ.z8i9JXs3yMwCucoA'

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

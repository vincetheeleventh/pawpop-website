// Setup Supabase Storage bucket for artwork images
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  try {
    console.log('🚀 Setting up Supabase Storage bucket for artwork images...');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const existingBucket = buckets.find(bucket => bucket.id === 'artwork-images');
    if (existingBucket) {
      console.log('✅ Storage bucket "artwork-images" already exists');
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('artwork-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log('✅ Storage bucket "artwork-images" created successfully');
    console.log('📋 Bucket configuration:');
    console.log('   - Public access: enabled');
    console.log('   - File size limit: 50MB');
    console.log('   - Allowed types: JPEG, PNG, WebP');

  } catch (error) {
    console.error('❌ Failed to setup storage bucket:', error.message);
    process.exit(1);
  }
}

setupStorageBucket();

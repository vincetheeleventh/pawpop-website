#!/usr/bin/env node

/**
 * Extract MonaLisa intermediate image URL from database for troubleshooting
 * Usage: node scripts/extract-monalisa-image.js [artwork_id_or_token]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractMonaLisaImage(identifier) {
  try {
    console.log(`🔍 Looking up artwork: ${identifier}`);
    
    // Try to find by ID first, then by access token
    let query = supabase
      .from('artworks')
      .select('id, access_token, generated_images, generation_step, created_at');
    
    if (identifier.match(/^\d+$/)) {
      // Numeric ID
      query = query.eq('id', parseInt(identifier));
    } else {
      // Assume it's an access token
      query = query.eq('access_token', identifier);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }
    
    if (!data) {
      console.error('❌ Artwork not found');
      return;
    }
    
    console.log(`✅ Found artwork ID: ${data.id}`);
    console.log(`📅 Created: ${data.created_at}`);
    console.log(`🎯 Generation step: ${data.generation_step}`);
    console.log(`🔗 Access token: ${data.access_token}`);
    
    // Extract generated_images JSONB data
    const generatedImages = data.generated_images;
    
    if (!generatedImages) {
      console.log('⚠️  No generated_images data found');
      return;
    }
    
    console.log('\n📊 Generated Images Data:');
    console.log(JSON.stringify(generatedImages, null, 2));
    
    // Extract specific image URLs
    if (generatedImages.monalisa_base) {
      console.log('\n🎨 MonaLisa Base Image:');
      console.log(generatedImages.monalisa_base);
      console.log('\n🔗 Direct link to view/download:');
      console.log(generatedImages.monalisa_base);
    }
    
    if (generatedImages.artwork_preview) {
      console.log('\n🖼️  Artwork Preview:');
      console.log(generatedImages.artwork_preview);
    }
    
    if (generatedImages.artwork_full_res) {
      console.log('\n🎯 Full Resolution:');
      console.log(generatedImages.artwork_full_res);
    }
    
    // Show artwork page URL
    console.log(`\n🌐 Artwork page: http://localhost:3000/artwork/${data.access_token}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get identifier from command line args
const identifier = process.argv[2];

if (!identifier) {
  console.log('Usage: node scripts/extract-monalisa-image.js [artwork_id_or_token]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/extract-monalisa-image.js 123');
  console.log('  node scripts/extract-monalisa-image.js abc123def456...');
  process.exit(1);
}

extractMonaLisaImage(identifier);

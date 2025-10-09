#!/usr/bin/env node
/*
  Diagnose latest artwork pipeline state in production.
  - Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env
  - Prints latest artwork fields and any related admin_reviews
  - Highlights likely blockers for generation and admin emails
*/

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false }
  })

  console.log('🔍 Fetching most recent artwork...')
  const { data: artworks, error: aerr } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (aerr) {
    console.error('❌ Error fetching artworks:', aerr)
    process.exit(1)
  }

  const artwork = artworks && artworks[0]
  if (!artwork) {
    console.log('No artworks found.')
    process.exit(0)
  }

  console.log('\n✅ Latest artwork:')
  console.log(JSON.stringify({
    id: artwork.id,
    created_at: artwork.created_at,
    customer_email: artwork.customer_email,
    generation_step: artwork.generation_step,
    processing_status: artwork.processing_status,
    source_images: artwork.source_images,
    generated_images: artwork.generated_images,
    review_status: artwork.review_status,
  }, null, 2))

  console.log('\n🔗 Querying related admin_reviews...')
  const { data: reviews, error: rerr } = await supabase
    .from('admin_reviews')
    .select('*')
    .eq('artwork_id', artwork.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (rerr) {
    console.error('❌ Error fetching admin_reviews:', rerr)
  } else {
    console.log(JSON.stringify(reviews, null, 2))
  }

  // Quick heuristics
  console.log('\n🧠 Heuristics:')
  const hasAnySource = !!(artwork.source_images && (artwork.source_images.pet_mom_photo || artwork.source_images.pet_photo))
  console.log('- Has source images:', hasAnySource)
  console.log('- Generation step:', artwork.generation_step)

  const reviewNeeded = process.env.ENABLE_HUMAN_REVIEW === 'true'
  console.log('- ENABLE_HUMAN_REVIEW:', process.env.ENABLE_HUMAN_REVIEW)
  console.log('- EMAIL_TEST_MODE:', process.env.EMAIL_TEST_MODE)

  if (reviewNeeded && (!reviews || reviews.length === 0)) {
    console.log('⚠️ Human review enabled but no admin_reviews exist. Review creation may have failed in pet integration step.')
  }

  if (artwork.generation_step !== 'completed') {
    console.log('⚠️ Artwork not completed. Check monalisa-maker and pet-integration logs, and Supabase Storage write success.')
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})

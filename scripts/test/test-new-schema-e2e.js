#!/usr/bin/env node

/**
 * End-to-End Test for New Database Schema
 * Tests complete image generation workflow with organized JSONB fields
 */

const { createClient } = require('@supabase/supabase-js');
const { fal } = require('@fal-ai/client');

require('dotenv').config({ path: '.env.local' });

// Test configuration
const TEST_CONFIG = {
  email: 'test-new-schema@pawpopart.com',
  petName: 'Schema Test Pet',
  customerName: 'Schema Tester',
  testImages: {
    petPhoto: 'https://example.com/test-pet.jpg',
    petMomPhoto: 'https://example.com/test-mom.jpg'
  }
};

class NewSchemaE2ETest {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    fal.config({
      credentials: process.env.FAL_KEY
    });
    
    this.testArtworkId = null;
  }

  async runFullTest() {
    console.log('🧪 Starting New Schema E2E Test\n');
    
    try {
      // Test 1: Create artwork with new schema
      await this.testArtworkCreation();
      
      // Test 2: Test helper functions
      await this.testHelperFunctions();
      
      // Test 3: Test workflow tracking
      await this.testWorkflowTracking();
      
      // Test 4: Test image generation pipeline
      await this.testImageGenerationPipeline();
      
      // Test 5: Test data integrity
      await this.testDataIntegrity();
      
      // Test 6: Cleanup
      await this.cleanup();
      
      console.log('🎉 All tests passed! New schema is working correctly.\n');
      return true;
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      await this.cleanup();
      return false;
    }
  }

  async testArtworkCreation() {
    console.log('1️⃣ Testing artwork creation with new schema...');
    
    // Create new artwork record
    const { data: artwork, error } = await this.supabase
      .from('artworks')
      .insert({
        customer_email: TEST_CONFIG.email,
        customer_name: TEST_CONFIG.customerName,
        pet_name: TEST_CONFIG.petName,
        original_image_url: 'https://example.com/original-base.jpg', // Required field
        original_pet_url: TEST_CONFIG.testImages.petPhoto,
        original_pet_mom_url: TEST_CONFIG.testImages.petMomPhoto,
        generation_status: 'pending',
        source_images: {
          pet_photo: TEST_CONFIG.testImages.petPhoto,
          pet_mom_photo: TEST_CONFIG.testImages.petMomPhoto,
          uploadthing_keys: { pet: 'test-key-1', mom: 'test-key-2' }
        },
        generated_images: {
          monalisa_base: '',
          artwork_preview: '',
          artwork_full_res: '',
          generation_steps: []
        },
        delivery_images: {
          digital_download: '',
          print_ready: '',
          mockups: {}
        },
        generation_step: 'pending',
        processing_status: {
          artwork_generation: 'pending',
          upscaling: 'not_required',
          mockup_generation: 'pending'
        }
      })
      .select()
      .single();

    if (error) throw new Error(`Artwork creation failed: ${error.message}`);
    
    this.testArtworkId = artwork.id;
    console.log(`✅ Artwork created successfully: ${artwork.id}`);
    
    // Verify JSONB fields are properly structured
    if (!artwork.source_images.pet_photo) {
      throw new Error('source_images.pet_photo not set correctly');
    }
    if (!artwork.generated_images.generation_steps) {
      throw new Error('generated_images.generation_steps not initialized');
    }
    if (!artwork.processing_status.artwork_generation) {
      throw new Error('processing_status.artwork_generation not set');
    }
    
    console.log('✅ JSONB fields verified correctly structured\n');
  }

  async testHelperFunctions() {
    console.log('2️⃣ Testing helper functions...');
    
    // Test get_artwork_image function
    const { data: petPhoto, error: getError } = await this.supabase
      .rpc('get_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'source',
        image_key: 'pet_photo'
      });

    if (getError) throw new Error(`get_artwork_image failed: ${getError.message}`);
    if (petPhoto !== TEST_CONFIG.testImages.petPhoto) {
      throw new Error('get_artwork_image returned incorrect value');
    }
    console.log('✅ get_artwork_image function working');

    // Test update_artwork_image function
    const testGeneratedUrl = 'https://example.com/generated-artwork.jpg';
    const { data: updateResult, error: updateError } = await this.supabase
      .rpc('update_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'generated',
        image_key: 'artwork_preview',
        image_url: testGeneratedUrl
      });

    if (updateError) throw new Error(`update_artwork_image failed: ${updateError.message}`);
    console.log('✅ update_artwork_image function working');

    // Verify the update worked
    const { data: updatedArtwork, error: verifyError } = await this.supabase
      .from('artworks')
      .select('generated_images')
      .eq('id', this.testArtworkId)
      .single();

    if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);
    if (updatedArtwork.generated_images.artwork_preview !== testGeneratedUrl) {
      throw new Error('Image update verification failed');
    }
    console.log('✅ Helper functions verified working correctly\n');
  }

  async testWorkflowTracking() {
    console.log('3️⃣ Testing workflow tracking...');
    
    // Update generation step and processing status
    const { error: updateError } = await this.supabase
      .from('artworks')
      .update({
        generation_step: 'monalisa_generation',
        processing_status: {
          artwork_generation: 'processing',
          upscaling: 'not_required',
          mockup_generation: 'pending'
        },
        generation_metadata: {
          started_at: new Date().toISOString(),
          model_version: 'flux-pro-v1.1',
          parameters: { steps: 28, guidance: 3.5 }
        }
      })
      .eq('id', this.testArtworkId);

    if (updateError) throw new Error(`Workflow update failed: ${updateError.message}`);
    console.log('✅ Workflow tracking updated successfully');

    // Verify workflow state
    const { data: artwork, error: fetchError } = await this.supabase
      .from('artworks')
      .select('generation_step, processing_status, generation_metadata')
      .eq('id', this.testArtworkId)
      .single();

    if (fetchError) throw new Error(`Workflow fetch failed: ${fetchError.message}`);
    
    if (artwork.generation_step !== 'monalisa_generation') {
      throw new Error('generation_step not updated correctly');
    }
    if (artwork.processing_status.artwork_generation !== 'processing') {
      throw new Error('processing_status not updated correctly');
    }
    if (!artwork.generation_metadata.model_version) {
      throw new Error('generation_metadata not stored correctly');
    }
    
    console.log('✅ Workflow tracking verified working correctly\n');
  }

  async testImageGenerationPipeline() {
    console.log('4️⃣ Testing image generation pipeline simulation...');
    
    // Simulate MonaLisa generation
    await this.simulateMonaLisaGeneration();
    
    // Simulate pet integration
    await this.simulatePetIntegration();
    
    // Simulate completion
    await this.simulateCompletion();
    
    console.log('✅ Image generation pipeline simulation completed\n');
  }

  async simulateMonaLisaGeneration() {
    console.log('   📸 Simulating MonaLisa base generation...');
    
    const monalisaUrl = 'https://example.com/monalisa-base.jpg';
    
    // Update with MonaLisa base image
    const { error } = await this.supabase
      .rpc('update_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'generated',
        image_key: 'monalisa_base',
        image_url: monalisaUrl
      });

    if (error) throw new Error(`MonaLisa update failed: ${error.message}`);
    
    // Update generation step
    await this.supabase
      .from('artworks')
      .update({
        generation_step: 'pet_integration',
        generation_metadata: {
          monalisa_completed_at: new Date().toISOString(),
          monalisa_url: monalisaUrl
        }
      })
      .eq('id', this.testArtworkId);
    
    console.log('   ✅ MonaLisa generation simulated');
  }

  async simulatePetIntegration() {
    console.log('   🐕 Simulating pet integration...');
    
    const finalArtworkUrl = 'https://example.com/final-artwork.jpg';
    
    // Update with final artwork
    await this.supabase
      .rpc('update_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'generated',
        image_key: 'artwork_preview',
        image_url: finalArtworkUrl
      });

    // Update delivery images
    await this.supabase
      .rpc('update_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'delivery',
        image_key: 'digital_download',
        image_url: finalArtworkUrl
      });

    // Update status
    await this.supabase
      .from('artworks')
      .update({
        generation_step: 'completed',
        generation_status: 'completed',
        processing_status: {
          artwork_generation: 'completed',
          upscaling: 'not_required',
          mockup_generation: 'pending'
        }
      })
      .eq('id', this.testArtworkId);
    
    console.log('   ✅ Pet integration simulated');
  }

  async simulateCompletion() {
    console.log('   🎨 Simulating artwork completion...');
    
    // Add mockup URLs
    const mockupUrls = {
      framed_canvas: 'https://example.com/mockup-canvas.jpg',
      art_print: 'https://example.com/mockup-print.jpg'
    };

    await this.supabase
      .rpc('update_artwork_image', {
        artwork_id: this.testArtworkId,
        image_type: 'delivery',
        image_key: 'mockups',
        image_url: JSON.stringify(mockupUrls)
      });

    // Final status update
    await this.supabase
      .from('artworks')
      .update({
        processing_status: {
          artwork_generation: 'completed',
          upscaling: 'not_required',
          mockup_generation: 'completed'
        },
        generation_metadata: {
          completed_at: new Date().toISOString(),
          total_processing_time: '145 seconds'
        }
      })
      .eq('id', this.testArtworkId);
    
    console.log('   ✅ Artwork completion simulated');
  }

  async testDataIntegrity() {
    console.log('5️⃣ Testing data integrity...');
    
    // Fetch final artwork state
    const { data: artwork, error } = await this.supabase
      .from('artworks')
      .select('*')
      .eq('id', this.testArtworkId)
      .single();

    if (error) throw new Error(`Data fetch failed: ${error.message}`);
    
    // Verify all image types are populated
    const checks = [
      { field: 'source_images.pet_photo', value: artwork.source_images.pet_photo },
      { field: 'source_images.pet_mom_photo', value: artwork.source_images.pet_mom_photo },
      { field: 'generated_images.monalisa_base', value: artwork.generated_images.monalisa_base },
      { field: 'generated_images.artwork_preview', value: artwork.generated_images.artwork_preview },
      { field: 'delivery_images.digital_download', value: artwork.delivery_images.digital_download },
      { field: 'processing_status.artwork_generation', value: artwork.processing_status.artwork_generation },
      { field: 'generation_step', value: artwork.generation_step }
    ];

    for (const check of checks) {
      if (!check.value) {
        throw new Error(`${check.field} is empty or null`);
      }
    }
    
    console.log('✅ All required fields populated correctly');
    
    // Verify workflow consistency
    if (artwork.generation_step !== 'completed') {
      throw new Error('generation_step should be completed');
    }
    if (artwork.processing_status.artwork_generation !== 'completed') {
      throw new Error('artwork_generation status should be completed');
    }
    
    console.log('✅ Workflow state is consistent');
    console.log('✅ Data integrity verified\n');
  }

  async cleanup() {
    console.log('6️⃣ Cleaning up test data...');
    
    if (this.testArtworkId) {
      const { error } = await this.supabase
        .from('artworks')
        .delete()
        .eq('id', this.testArtworkId);
      
      if (error) {
        console.warn(`Cleanup warning: ${error.message}`);
      } else {
        console.log('✅ Test artwork cleaned up');
      }
    }
    
    console.log('✅ Cleanup completed\n');
  }
}

// Run the test
async function main() {
  const test = new NewSchemaE2ETest();
  const success = await test.runFullTest();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { NewSchemaE2ETest };

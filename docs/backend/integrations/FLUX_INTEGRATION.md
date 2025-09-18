---
title: "MonaLisa Maker Integration"
date: 2025-08-30
author: "Cascade"
version: "v3.0.0"
status: "ready"
---

# MonaLisa Maker - AI Portrait & Pet Integration

## Overview

MonaLisa Maker is a 2-step AI transformation pipeline that creates personalized Mona Lisa portraits with pets. Step 1 transforms user photos into Mona Lisa styled portraits, and Step 2 adds pets to the portrait using advanced AI composition.

**Enhanced Storage**: Generated images are now stored in Supabase Storage as organized JPG URLs instead of base64 data URIs, providing better performance and accessibility.

## Architecture

### Pipeline Flow
1. **User Photo Input** → MonaLisa Maker (Flux Kontext LoRA) → Mona Lisa styled portrait
2. **Pet Integration** → Flux Pro Kontext Max → Final portrait with pets in lap
3. **Final Output** → Complete Mona Lisa portrait with pets (9:16 aspect ratio)

### Components Created

#### 1. MonaLisa Maker API (`/src/app/api/monalisa-maker/route.ts`)
- Step 1: Transform user photos into Mona Lisa portraits using Flux Kontext LoRA
- Supports file uploads and streaming processing
- Uploads generated images to Supabase Storage with organized filenames
- Returns both Supabase URL and fal.ai fallback URL

#### 2. Pet Integration API (`/src/app/api/pet-integration/route.ts`)
- Step 2: Add pets to Mona Lisa portraits using Flux Pro Kontext Max
- Combines portrait from Step 1 with pet images
- Advanced AI composition for natural pet placement
- Stores final artwork in Supabase Storage with artwork ID organization

#### 3. Complete Pipeline API (`/src/app/api/monalisa-complete/route.ts`)
- End-to-end pipeline combining both steps
- Takes user photo and pet image, returns final portrait
- Handles error recovery and fallbacks

#### 4. Testing Scripts
- `/scripts/test-monalisa-maker.js` - Test Step 1 transformation
- `/scripts/test-pet-integration.js` - Test Step 2 pet addition
- `/scripts/test-complete-pipeline.js` - Test full pipeline

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @fal-ai/client @supabase/supabase-js
```

### 2. Environment Variables
Add to `.env.local`:
```env
# fal.ai API Configuration
FAL_KEY=your-fal-api-key
# OR
HF_TOKEN=your-huggingface-token

# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Get API Keys
- **fal.ai**: https://fal.ai (recommended)
- **Hugging Face**: https://huggingface.co/settings/tokens
- **Supabase**: Create project at https://supabase.com and get service role key

## Usage

### Testing the Pipeline

#### Individual Steps
```bash
# Test Step 1: MonaLisa Maker
node scripts/test-monalisa-maker.js

# Test Step 2: Pet Integration
node scripts/test-pet-integration.js

# Test Complete Pipeline
node scripts/test-complete-pipeline.js
```

#### Test Images Available
- **User photos**: `/public/images/flux-test.png`
- **Pet images**: `/public/images/test pets/`
  - `test-cat.png`
  - `test-corgi.png` 
  - `test-gshep.png`

### API Endpoints

#### `/api/monalisa-maker` - Step 1: Portrait Transformation
```typescript
POST /api/monalisa-maker
Content-Type: multipart/form-data

// Form data:
image: File (user photo)
artworkId: string (optional, for organized storage)

// Response:
{
  "imageUrl": "https://supabase.co/storage/artwork-123/monalisa_base_456.jpg",
  "falImageUrl": "https://v3.fal.media/files/...", // fallback URL
  "success": true
}
```

#### `/api/pet-integration` - Step 2: Add Pets
```typescript
POST /api/pet-integration
Content-Type: multipart/form-data

// Form data:
portrait: File (MonaLisa portrait from Step 1)
pet: File (pet image)
artworkId: string (optional, for organized storage)

// Response:
{
  "imageUrl": "https://supabase.co/storage/artwork-123/artwork_final_789.jpg",
  "falImageUrl": "https://v3.fal.media/files/...", // fallback URL
  "success": true,
  "requestId": "pet-request-123"
}
```

#### `/api/monalisa-complete` - Complete Pipeline
```typescript
POST /api/monalisa-complete
Content-Type: multipart/form-data

// Form data:
userImage: File (user photo)
petImage: File (pet image)
```

#### JSON API Usage
```typescript
// Step 1: MonaLisa Maker
POST /api/monalisa-maker
{
  "imageUrl": "https://example.com/user-photo.jpg",
  "artworkId": "123" // optional, for organized storage
}

// Response:
{
  "imageUrl": "https://supabase.co/storage/artwork-123/monalisa_base_456.jpg",
  "falImageUrl": "https://v3.fal.media/files/...", // fallback URL
  "success": true
}

// Step 2: Pet Integration
POST /api/pet-integration
{
  "portraitUrl": "https://example.com/monalisa-portrait.jpg",
  "petUrl": "https://example.com/pet-photo.jpg",
  "artworkId": "123" // optional, for organized storage
}

// Response:
{
  "imageUrl": "https://supabase.co/storage/artwork-123/artwork_final_789.jpg",
  "falImageUrl": "https://v3.fal.media/files/...", // fallback URL
  "success": true,
  "requestId": "pet-request-123"
}

// Complete Pipeline
POST /api/monalisa-complete
{
  "userImageUrl": "https://example.com/user-photo.jpg",
  "petImageUrl": "https://example.com/pet-photo.jpg",
  "artworkId": "123" // optional, for organized storage
}
```

## Model Configuration

### Step 1: MonaLisa Maker (Flux Kontext LoRA)

```javascript
const monaLisaConfig = {
  model: "fal-ai/flux-kontext-lora",
  input: {
    image_url: userImageUrl,
    prompt: "keep likeness, change pose and style to mona lisa, keep hairstyle",
    loras: [{
      path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
      scale: 1.0
    }],
    resolution_mode: "9:16",
    guidance_scale: 7.5,
    num_inference_steps: 28,
    seed: Math.floor(Math.random() * 1000000)
  }
};
```

### Step 2: Pet Integration (Flux Pro Kontext Max)

```javascript
const petIntegrationConfig = {
  model: "fal-ai/flux-pro/kontext/max",
  input: {
    prompt: "Incorporate the pets into the painting of the woman. She is holding them in her lap. Keep the painted style and likeness of the woman and pets",
    guidance_scale: 3.5,
    num_images: 1,
    output_format: "jpeg",
    safety_tolerance: "2",
    image_url: portraitUrl,
    aspect_ratio: "9:16"
  }
};
```

### Configuration Details

**Step 1 - MonaLisa Maker:**
- **LoRA Model**: Custom Mona Lisa style adapter hosted on fal.ai
- **Prompt**: Fixed to preserve likeness while applying Mona Lisa styling
- **Resolution**: 9:16 aspect ratio for portrait format
- **LoRA Scale**: 1.0 for full transformation effect

**Step 2 - Pet Integration:**
- **Model**: Flux Pro Kontext Max for advanced composition
- **Guidance Scale**: 3.5 for balanced prompt adherence
- **Output Format**: JPEG for final portraits
- **Safety Tolerance**: Level 2 for content filtering

## Benefits of Direct Transformation

### Advantages Over Overlay Approach

- **Better likeness preservation**: AI understands facial features contextually
- **Natural pose variations**: Not limited to overlay positioning constraints
- **Artistic coherence**: Unified Mona Lisa style throughout the image
- **Simplified pipeline**: Single transformation step reduces complexity
- **Higher quality**: No compositing artifacts or alignment issues

### Performance Considerations

- **Processing time**: ~30-60 seconds per image with streaming updates
- **Quality**: Higher fidelity than overlay compositing
- **Scalability**: Direct API calls to fal.ai infrastructure
- **Cost**: Per-generation pricing through fal.ai

## Error Handling

### Common Issues

#### API Authentication
```javascript
// Check environment variables
if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
  throw new Error('Missing FAL_KEY or HF_TOKEN environment variable');
}
```

#### fal.ai Validation Errors (422)
```javascript
// Handle validation errors with detailed logging
if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
  const errorBody = (error as any).body || error;
  console.error('🔍 Validation error details:', JSON.stringify(errorBody, null, 2));
  
  // Common cause: Invalid image_url format
  // Solution: Ensure URLs are HTTPS or Data URIs, not blob URLs
  return NextResponse.json(
    { error: 'Invalid image format or parameters. Please try with a different image.' },
    { status: 422 }
  );
}
```

#### Image Upload Failures
```javascript
try {
  const imageUrl = await fal.storage.upload(imageFile);
} catch (error) {
  console.error('Upload failed:', error);
  // Handle upload error
}
```

#### Model Processing Errors
```javascript
try {
  const result = await fal.stream('fal-ai/flux-kontext-lora', {
    input: fluxConfig.input,
    logs: true,
    onQueueUpdate: (update) => {
      console.log('Status:', update.status);
    }
  });
} catch (error) {
  console.error('Flux processing failed:', error);
  // Handle processing error
}
```

## Troubleshooting

### Common Issues

1. **422 Validation Error - "Input must be a valid HTTPS URL or a Data URI"**: 
   - **Cause**: Passing blob URLs (e.g., `blob:http://localhost:3000/...`) to fal.ai API
   - **Solution**: Send File objects via FormData instead of converting to blob URLs
   - **Fixed**: Updated UploadModal.tsx to use FormData for file uploads
2. **Authentication Failed**: Verify FAL_KEY environment variable
3. **Image Upload Issues**: Ensure image format is supported (PNG, JPG)
4. **Slow Processing**: Normal for high-quality transformations (30-60s)

### Debug Steps

```bash
# Test API credentials
node scripts/test-flux.js

# Check environment variables
echo $FAL_KEY

# Verify image format
file public/images/flux-test.png
```

## Post-Purchase Image Upscaling Pipeline

### Overview
After successful Stripe payment, implement a high-resolution upscaling pipeline to prepare images for physical product printing via Printify.

### Architecture Flow
```
Stripe Payment Success → Webhook Trigger → Image Upscaling → Printify Integration
```

### Components to Build

#### 1. Image Upscaling API (`/src/app/api/upscale/route.ts`)
- **Purpose**: Enhance generated artwork resolution for print quality
- **Input**: Generated artwork URL from completed pipeline (2:3 aspect ratio)
- **Output**: High-resolution version (4K+ for print quality)
- **Service Options**:
  - **Real-ESRGAN**: General purpose upscaling (4x enhancement)
  - **ESRGAN**: Photo-realistic enhancement
  - **fal.ai upscaling models**: `fal-ai/real-esrgan` or `fal-ai/esrgan`
  - **Topaz Gigapixel AI**: Premium option via API

#### 2. Stripe Webhook Enhancement (`/src/app/api/webhook/route.ts`)
- **Trigger**: `checkout.session.completed` event
- **Process**:
  1. Verify payment success for physical products
  2. Extract artwork ID from session metadata
  3. Trigger upscaling pipeline
  4. Update order status to "processing_print"

#### 3. Print-Ready Processing API (`/src/app/api/printify/prepare-artwork/route.ts`)
- **Purpose**: Prepare upscaled images for Printify specifications
- **Features**:
  - Format conversion (PNG/JPEG optimization)
  - DPI adjustment (300 DPI for print)
  - Color profile conversion (sRGB/CMYK)
  - Size validation per product type

#### 4. Enhanced Printify Integration
- **Update**: `/src/lib/printify.ts`
- **Enhancement**: Accept high-resolution image URLs
- **Validation**: Ensure minimum resolution requirements per product
- **Fallback**: Use original resolution if upscaling fails

### Implementation Plan

#### Phase 1: Upscaling Service Integration
```typescript
// /src/app/api/upscale/route.ts
export async function POST(req: NextRequest) {
  const { imageUrl, targetResolution = "4x" } = await req.json();
  
  // Call upscaling service (Real-ESRGAN via fal.ai)
  const result = await fal.subscribe("fal-ai/real-esrgan", {
    input: {
      image_url: imageUrl,
      scale: 4,
      model_name: "RealESRGAN_x4plus"
    }
  });
  
  return NextResponse.json({
    originalUrl: imageUrl,
    upscaledUrl: result.data.image.url,
    resolution: result.data.resolution
  });
}
```

#### Phase 2: Webhook Integration
```typescript
// Enhanced webhook in /src/app/api/webhook/route.ts
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const artworkId = session.metadata?.artwork_id;
  
  // For physical products only
  if (session.metadata?.product_type !== 'digital') {
    // Trigger upscaling pipeline
    await fetch('/api/upscale-and-print', {
      method: 'POST',
      body: JSON.stringify({ artworkId, orderId: session.id })
    });
  }
}
```

#### Phase 3: Print Pipeline Orchestration
```typescript
// /src/app/api/upscale-and-print/route.ts
export async function POST(req: NextRequest) {
  const { artworkId, orderId } = await req.json();
  
  // 1. Get original artwork
  const artwork = await getArtworkById(artworkId);
  
  // 2. Upscale image
  const upscaled = await fetch('/api/upscale', {
    method: 'POST',
    body: JSON.stringify({ imageUrl: artwork.generated_image_url })
  });
  
  // 3. Create Printify product with high-res image
  const printifyProduct = await createPrintifyProduct({
    imageUrl: upscaled.upscaledUrl,
    productType: session.metadata.product_type
  });
  
  // 4. Update order status
  await updateOrderStatus(orderId, 'print_ready');
}
```

### Service Provider Options

#### Option 1: fal.ai Real-ESRGAN (Recommended)
- **Pros**: Same provider, consistent API, good quality
- **Cons**: Additional cost per upscale
- **Endpoint**: `fal-ai/real-esrgan`
- **Cost**: ~$0.02-0.05 per upscale

#### Option 2: Replicate ESRGAN
- **Pros**: Multiple model options, competitive pricing
- **Cons**: Additional service integration
- **Models**: `nightmareai/real-esrgan`, `jingyunliang/swinir`

#### Option 3: Topaz Gigapixel AI
- **Pros**: Industry standard, highest quality
- **Cons**: Higher cost, complex integration
- **Use case**: Premium tier products

### Database Schema Updates

```sql
-- Add upscaling tracking to artworks table
ALTER TABLE artworks ADD COLUMN upscaled_image_url TEXT;
ALTER TABLE artworks ADD COLUMN upscale_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE artworks ADD COLUMN upscale_resolution VARCHAR(20);
ALTER TABLE artworks ADD COLUMN upscaled_at TIMESTAMP;

-- Add print preparation tracking
ALTER TABLE orders ADD COLUMN print_ready_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN high_res_image_url TEXT;
```

### Error Handling & Fallbacks

1. **Upscaling Failure**: Use original resolution with warning
2. **Service Timeout**: Retry with exponential backoff
3. **Quality Issues**: Fallback to alternative upscaling service
4. **Printify Rejection**: Auto-adjust format/resolution

### Monitoring & Analytics

- Track upscaling success rates
- Monitor processing times
- Quality comparison metrics
- Cost per upscale analysis

## Next Steps

1. **Production Integration**: Replace overlay endpoints with flux-direct
2. **UI Updates**: Add progress indicators for streaming
3. **Batch Processing**: Handle multiple images efficiently
4. **Quality Optimization**: Fine-tune LoRA parameters
5. **🆕 Post-Purchase Pipeline**: Implement upscaling and print-ready processing

---

## Summary

The Flux Kontext LoRA integration provides a streamlined approach to transforming user photos into Mona Lisa styled portraits. The direct transformation method offers superior quality and likeness preservation compared to the previous overlay approach.

**Key files created:**
- `/scripts/test-flux.js` - Standalone testing
- `/src/app/api/flux-direct/route.ts` - API endpoint
- `/src/app/test-flux/page.tsx` - Test UI

**Ready for production use with proper error handling and streaming support.**

- **fal.ai pricing**: Pay-per-use model
- **Typical cost**: ~$0.01-0.05 per image transformation
- **Optimization**: Cache results, batch processing, lower steps for previews

---

**Status**: Ready for testing and integration
**Dependencies**: @fal-ai/client, existing overlay pipeline
**Test URL**: http://localhost:3000/test-flux

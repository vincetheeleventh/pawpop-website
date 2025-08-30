---
title: "Flux LoRA Integration"
date: 2025-08-29
author: "Cascade"
version: "v1.0.0"
status: "ready"
---

# Flux LoRA Integration Implementation Plan

## Overview

This implementation integrates the fal.ai Flux LoRA model into the existing headshot overlay pipeline, enabling AI-powered artistic transformations of the composite images.

## Architecture

### Pipeline Flow
1. **Headshot Overlay** (existing) → Face detection + composite onto Mona Lisa
2. **Flux Transformation** (new) → AI artistic style transfer using LoRA model  
3. **Final Output** → Stylized composite image

### Components Created

#### 1. Standalone Testing (`/scripts/test-flux.js`)
- Tests Flux model independently
- Validates API credentials
- Downloads and saves results locally

#### 2. Flux API Endpoint (`/src/app/api/flux-transform/route.ts`)
- Dedicated endpoint for Flux transformations
- Supports both file uploads and image URLs
- Handles fal.ai storage uploads automatically

#### 3. Combined Pipeline (`/src/app/api/overlay-flux/route.ts`)
- Integrates overlay + Flux in single request
- Fallback to overlay-only if Flux fails
- Configurable transformation parameters

#### 4. Test UI (`/src/app/test-flux/page.tsx`)
- Interactive testing interface
- Preset prompts for common transformations
- Real-time processing feedback

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @fal-ai/client
```

### 2. Environment Variables
Add to `.env.local`:
```env
FAL_KEY=your-fal-api-key
# OR
HF_TOKEN=your-huggingface-token
```

### 3. Get API Keys
- **fal.ai**: https://fal.ai (recommended)
- **Hugging Face**: https://huggingface.co/settings/tokens

## Usage

### Testing the Pipeline

1. **Navigate to test page**: `/test-flux`
2. **Select a headshot** from the available options
3. **Choose transformation**:
   - Skip Flux: Overlay only (faster)
   - With Flux: Full artistic transformation
4. **Customize prompt** or use presets
5. **Adjust strength** (0.1 = subtle, 1.0 = strong)
6. **Generate and download** results

### API Endpoints

#### `/api/flux-transform` - Flux Only
```typescript
POST /api/flux-transform
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Transform into oil painting",
  "strength": 0.8,
  "guidance_scale": 7.5,
  "num_inference_steps": 28
}
```

#### `/api/overlay-flux` - Complete Pipeline
```typescript
POST /api/overlay-flux
Content-Type: application/json

{
  "monaUrl": "/images/monalisa.png",
  "headUrl": "/images/test headshots/Screenshot_2.jpg",
  "fit": "width",
  "scale": 1.0,
  "fluxPrompt": "Transform into Van Gogh style painting",
  "fluxStrength": 0.8,
  "skipFlux": false
}
```

### Standalone Testing Script
```bash
node scripts/test-flux.js
```

## Integration into Existing Pipeline

The Flux transformation can be integrated into your existing image processing workflow in several ways:

### Option 1: Post-Processing Step
Add Flux as final step after overlay:
```typescript
// 1. Create overlay composite (existing)
const overlayResult = await fetch('/api/overlay', { ... });

// 2. Apply Flux transformation
const fluxResult = await fetch('/api/flux-transform', {
  method: 'POST',
  body: overlayResult.body,
  headers: { 'Content-Type': 'image/png' }
});
```

### Option 2: Single Endpoint (Recommended)
Use the combined endpoint for seamless processing:
```typescript
const result = await fetch('/api/overlay-flux', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monaUrl: '/images/monalisa.png',
    headUrl: userHeadshotUrl,
    fluxPrompt: 'Transform into Renaissance masterpiece'
  })
});
```

## Configuration Options

### Flux Parameters
- **prompt**: Transformation description
- **strength**: 0.1-1.0 (transformation intensity)
- **guidance_scale**: 1.0-20.0 (prompt adherence)
- **num_inference_steps**: 10-50 (quality vs speed)
- **seed**: Random seed for reproducibility

### Overlay Parameters
- **fit**: "width" | "height" (scaling method)
- **scale**: Multiplier for face size matching
- **skipFlux**: Boolean to bypass Flux transformation

## Error Handling

The implementation includes comprehensive error handling:

1. **API Credential Validation**: Clear messages for missing/invalid keys
2. **Graceful Fallbacks**: Overlay-only if Flux fails
3. **Rate Limit Handling**: Proper HTTP status codes
4. **Image Processing Errors**: Detailed logging and recovery

## Performance Considerations

- **Flux Processing Time**: 10-30 seconds depending on parameters
- **Storage Uploads**: Automatic via fal.ai storage service
- **Memory Usage**: Buffers handled efficiently with streaming
- **Caching**: No-store headers prevent unwanted caching

## Prompt Engineering Tips

### Effective Prompts
- **Style-specific**: "oil painting", "watercolor", "digital art"
- **Artist references**: "in the style of Van Gogh", "Renaissance portrait"
- **Descriptive**: "dramatic lighting", "soft brushstrokes", "vibrant colors"

### Prompt Presets Included
1. Van Gogh oil painting style
2. Renaissance masterpiece with dramatic lighting
3. Soft watercolor painting
4. Modern digital art with neon colors
5. Classical baroque portrait
6. Impressionist with visible brushstrokes

## Next Steps

1. **Test the pipeline** using `/test-flux` page
2. **Integrate into production** workflow
3. **Customize prompts** for your specific use cases
4. **Monitor API usage** and costs
5. **Add more artistic styles** as needed

## Troubleshooting

### Common Issues
- **"Invalid credentials"**: Check FAL_KEY/HF_TOKEN in `.env.local`
- **"No image generated"**: Try different prompt or reduce strength
- **Slow processing**: Reduce num_inference_steps (try 20)
- **Out of quota**: Check fal.ai dashboard for usage limits

### Debug Mode
Set `NODE_ENV=development` for detailed error logging and stack traces.

## Cost Considerations

- **fal.ai pricing**: Pay-per-use model
- **Typical cost**: ~$0.01-0.05 per image transformation
- **Optimization**: Cache results, batch processing, lower steps for previews

---

**Status**: Ready for testing and integration
**Dependencies**: @fal-ai/client, existing overlay pipeline
**Test URL**: http://localhost:3000/test-flux

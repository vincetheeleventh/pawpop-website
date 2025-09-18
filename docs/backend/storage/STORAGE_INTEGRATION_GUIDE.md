# Storage Integration Guide

## Overview

This guide provides practical examples and integration patterns for using the MonaLisa storage enhancement with Supabase Storage.

## Quick Start

### 1. Environment Setup

```bash
# Install required dependencies
npm install @supabase/supabase-js

# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2. Basic Usage

```typescript
import { storeFalImageInSupabase } from '@/lib/supabase-storage';

// Store a generated image with artwork organization
const supabaseUrl = await storeFalImageInSupabase(
  'https://fal.ai/generated-image.jpg',
  'artwork-123',
  'monalisa_base'
);
// Returns: https://supabase.co/storage/artwork-123/monalisa_base_1234567890.jpg
```

## Integration Examples

### Frontend Upload Flow

```typescript
// components/forms/UploadModal.tsx
const handleMonaLisaGeneration = async () => {
  const formData = new FormData();
  formData.append('imageFile', selectedFile);
  formData.append('artworkId', artworkId); // Pass artwork ID for organization

  const response = await fetch('/api/monalisa-maker', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  
  // Update database with clean URLs
  await updateArtwork(artworkId, {
    generated_images: {
      monalisa_base: result.imageUrl, // Supabase URL
      // fallback available at result.falImageUrl
    }
  });
};
```

### API Implementation Pattern

```typescript
// app/api/monalisa-maker/route.ts
export async function POST(req: NextRequest) {
  try {
    // Extract artwork ID from request
    const formData = await req.formData();
    const artworkId = formData.get('artworkId') as string || 'unknown';
    
    // Generate image with fal.ai
    const result = await fal.stream('fal-ai/flux-kontext-lora', config);
    const falImageUrl = result.images[0].url;
    
    // Store in Supabase Storage with organized filename
    let imageUrl = falImageUrl; // fallback
    try {
      imageUrl = await storeFalImageInSupabase(falImageUrl, artworkId, 'monalisa_base');
    } catch (storageError) {
      console.warn('Storage upload failed, using fal.ai URL:', storageError);
    }
    
    return NextResponse.json({
      imageUrl,        // Supabase URL (preferred)
      falImageUrl,     // fal.ai URL (fallback)
      success: true
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Database Schema Integration

```typescript
// Database record structure
interface Artwork {
  id: string;
  generated_images: {
    monalisa_base?: string;      // Step 1 result
    artwork_preview?: string;    // Intermediate result
    artwork_full_res?: string;   // Final high-res result
  };
  // ... other fields
}

// Update artwork with storage URLs
const updateArtworkImages = async (artworkId: string, imageUrls: Partial<Artwork['generated_images']>) => {
  const { error } = await supabase
    .from('artworks')
    .update({
      generated_images: {
        ...existingImages,
        ...imageUrls
      }
    })
    .eq('id', artworkId);
    
  if (error) throw error;
};
```

## Storage Organization

### File Structure

```
supabase-storage/
└── artwork-images/
    ├── artwork-123/
    │   ├── monalisa_base_1234567890.jpg
    │   ├── artwork_preview_1234567891.jpg
    │   └── artwork_final_1234567892.jpg
    ├── artwork-456/
    │   ├── monalisa_base_1234567893.jpg
    │   └── artwork_final_1234567894.jpg
    └── unknown/
        └── monalisa_base_1234567895.jpg  # Missing artwork ID
```

### Filename Generation

```typescript
import { generateArtworkFileName } from '@/lib/supabase-storage';

// Generate organized filenames
const filename1 = generateArtworkFileName('123', 'monalisa_base');
// Returns: "123/monalisa_base_1234567890.jpg"

const filename2 = generateArtworkFileName('456', 'artwork_final', 'png');
// Returns: "456/artwork_final_1234567890.png"
```

## Error Handling Patterns

### Graceful Fallbacks

```typescript
const storeImageWithFallback = async (falUrl: string, artworkId: string, step: string) => {
  try {
    // Attempt Supabase Storage
    const supabaseUrl = await storeFalImageInSupabase(falUrl, artworkId, step);
    return {
      imageUrl: supabaseUrl,
      falImageUrl: falUrl,
      storageProvider: 'supabase'
    };
  } catch (error) {
    console.warn(`Supabase storage failed for ${step}:`, error);
    // Fallback to fal.ai URL
    return {
      imageUrl: falUrl,
      falImageUrl: falUrl,
      storageProvider: 'fal'
    };
  }
};
```

### Retry Logic

```typescript
const uploadWithRetry = async (imageUrl: string, filename: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImageToSupabaseStorage(imageUrl, filename);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## Testing Integration

### Unit Test Example

```typescript
import { storeFalImageInSupabase } from '@/lib/supabase-storage';

describe('Storage Integration', () => {
  it('should store image with artwork organization', async () => {
    const mockUrl = 'https://fal.ai/test-image.jpg';
    const artworkId = '123';
    const step = 'monalisa_base';
    
    const result = await storeFalImageInSupabase(mockUrl, artworkId, step);
    
    expect(result).toMatch(/supabase\.co\/storage\/123\/monalisa_base_\d+\.jpg/);
  });
});
```

### Integration Test

```typescript
describe('API Storage Integration', () => {
  it('should return both Supabase and fal.ai URLs', async () => {
    const formData = new FormData();
    formData.append('artworkId', '123');
    formData.append('imageFile', testFile);
    
    const response = await fetch('/api/monalisa-maker', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    expect(data.imageUrl).toContain('supabase.co');
    expect(data.falImageUrl).toContain('fal.media');
    expect(data.success).toBe(true);
  });
});
```

## Performance Optimization

### Parallel Processing

```typescript
const processMultipleImages = async (images: Array<{url: string, artworkId: string, step: string}>) => {
  const uploadPromises = images.map(({ url, artworkId, step }) =>
    storeFalImageInSupabase(url, artworkId, step).catch(error => {
      console.warn(`Failed to store ${step} for artwork ${artworkId}:`, error);
      return url; // Return original URL as fallback
    })
  );
  
  return await Promise.all(uploadPromises);
};
```

### Caching Strategy

```typescript
const imageCache = new Map<string, string>();

const getCachedOrStore = async (falUrl: string, artworkId: string, step: string) => {
  const cacheKey = `${artworkId}-${step}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  const supabaseUrl = await storeFalImageInSupabase(falUrl, artworkId, step);
  imageCache.set(cacheKey, supabaseUrl);
  
  return supabaseUrl;
};
```

## Monitoring and Debugging

### Storage Analytics

```typescript
const trackStorageMetrics = async (operation: string, success: boolean, duration: number) => {
  // Track storage operation metrics
  console.log(`Storage ${operation}: ${success ? 'SUCCESS' : 'FAILED'} in ${duration}ms`);
  
  // Optional: Send to analytics service
  // analytics.track('storage_operation', { operation, success, duration });
};
```

### Debug Helpers

```typescript
const debugStorageOperation = async (falUrl: string, artworkId: string, step: string) => {
  console.log(`🔍 Storage Debug - Artwork: ${artworkId}, Step: ${step}`);
  console.log(`📥 Source URL: ${falUrl}`);
  
  const startTime = Date.now();
  try {
    const result = await storeFalImageInSupabase(falUrl, artworkId, step);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Stored successfully in ${duration}ms`);
    console.log(`📤 Supabase URL: ${result}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Storage failed after ${duration}ms:`, error);
    throw error;
  }
};
```

## Migration from Base64

### Gradual Migration Pattern

```typescript
const getImageUrl = (artwork: Artwork): string => {
  // Prefer Supabase Storage URL
  if (artwork.generated_images?.monalisa_base) {
    return artwork.generated_images.monalisa_base;
  }
  
  // Fallback to legacy base64 (during migration period)
  if (artwork.generated_image_url?.startsWith('data:')) {
    return artwork.generated_image_url;
  }
  
  // Fallback to fal.ai URL
  return artwork.generated_image_url || '';
};
```

### Migration Script Example

```typescript
const migrateArtworkStorage = async (artworkId: string) => {
  const artwork = await getArtworkById(artworkId);
  
  // Skip if already migrated
  if (artwork.generated_images?.monalisa_base) {
    return;
  }
  
  // Convert base64 to Supabase Storage
  if (artwork.generated_image_url?.startsWith('data:')) {
    try {
      // Upload base64 to Supabase Storage
      const supabaseUrl = await uploadBase64ToSupabase(
        artwork.generated_image_url,
        artworkId,
        'monalisa_base'
      );
      
      // Update database
      await updateArtwork(artworkId, {
        generated_images: { monalisa_base: supabaseUrl }
      });
      
      console.log(`✅ Migrated artwork ${artworkId} to Supabase Storage`);
    } catch (error) {
      console.error(`❌ Migration failed for artwork ${artworkId}:`, error);
    }
  }
};
```

## Best Practices

### 1. Always Provide Fallbacks
```typescript
// ✅ Good: Graceful fallback
const imageUrl = result.imageUrl || result.falImageUrl || defaultImage;

// ❌ Bad: No fallback
const imageUrl = result.imageUrl; // Could be undefined
```

### 2. Use Artwork IDs for Organization
```typescript
// ✅ Good: Organized storage
await storeFalImageInSupabase(url, artworkId, 'monalisa_base');

// ❌ Bad: Unorganized storage
await storeFalImageInSupabase(url, 'unknown', 'monalisa_base');
```

### 3. Handle Errors Gracefully
```typescript
// ✅ Good: Non-blocking error handling
try {
  const supabaseUrl = await storeFalImageInSupabase(url, artworkId, step);
  return { imageUrl: supabaseUrl, storageProvider: 'supabase' };
} catch (error) {
  console.warn('Storage failed, using fallback:', error);
  return { imageUrl: url, storageProvider: 'fal' };
}
```

### 4. Monitor Performance
```typescript
// ✅ Good: Performance monitoring
const startTime = Date.now();
const result = await storeFalImageInSupabase(url, artworkId, step);
const duration = Date.now() - startTime;
console.log(`Storage completed in ${duration}ms`);
```

## Troubleshooting

### Common Issues

1. **Storage Upload Fails**
   - Check Supabase service role key permissions
   - Verify network connectivity
   - Monitor storage quota usage

2. **Missing Artwork IDs**
   - Images stored in `/unknown/` folder
   - Update frontend to pass artwork IDs
   - Implement migration for existing data

3. **Performance Issues**
   - Monitor upload times and file sizes
   - Consider image compression before upload
   - Implement retry logic with exponential backoff

### Debug Commands

```bash
# Check storage bucket configuration
npx supabase storage ls artwork-images

# Monitor storage usage
npx supabase storage du artwork-images

# Test storage upload
node scripts/test-storage-upload.js
```

This integration guide provides comprehensive examples for implementing the MonaLisa storage enhancement across your application.

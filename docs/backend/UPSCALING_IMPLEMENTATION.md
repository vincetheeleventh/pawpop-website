# Post-Purchase Image Upscaling Implementation

## Overview

The post-purchase image upscaling pipeline ensures physical products are printed with optimal quality by enhancing generated artworks to 4K+ resolution using fal.ai's clarity-upscaler after successful Stripe payments.

## Architecture

### Flow Diagram
```
User Purchase → Stripe Webhook → Order Processing → Upscaling → Printify Order Creation
                                      ↓
                               Database Updates → Status Tracking
```

### Key Components

1. **Upscaling API Endpoint** (`/api/upscale`)
2. **Enhanced Order Processing** (with upscaling integration)
3. **Database Schema** (upscaling status and URLs)
4. **Printify Integration** (using upscaled images)

## Database Schema Changes

### Artworks Table Updates

```sql
-- Added fields to artworks table
ALTER TABLE artworks ADD COLUMN upscaled_image_url TEXT;
ALTER TABLE artworks ADD COLUMN upscale_status TEXT DEFAULT 'pending' 
  CHECK (upscale_status IN ('pending', 'processing', 'completed', 'failed', 'not_required'));
ALTER TABLE artworks ADD COLUMN upscaled_at TIMESTAMP WITH TIME ZONE;

-- Performance index
CREATE INDEX idx_artworks_upscale_status ON artworks(upscale_status);
```

### Upscale Status Values

- `pending`: Initial state, awaiting upscaling
- `processing`: Currently being upscaled by fal.ai
- `completed`: Successfully upscaled, high-res image available
- `failed`: Upscaling failed, will use original image
- `not_required`: Digital products don't need upscaling

## API Endpoints

### POST /api/upscale

Triggers upscaling for a specific artwork using fal.ai clarity-upscaler.

**Request:**
```json
{
  "artworkId": "uuid"
}
```

**Response (Success):**
```json
{
  "success": true,
  "upscaled_image_url": "https://fal.media/upscaled-image.jpg",
  "request_id": "fal-request-123"
}
```

**Response (Already Upscaled):**
```json
{
  "success": true,
  "upscaled_image_url": "https://existing-upscaled.jpg",
  "message": "Already upscaled"
}
```

### GET /api/upscale?artworkId=uuid

Check upscaling status for an artwork.

**Response:**
```json
{
  "upscale_status": "completed",
  "upscaled_image_url": "https://fal.media/upscaled.jpg",
  "upscaled_at": "2024-01-01T12:00:00Z"
}
```

## Upscaling Configuration

### fal.ai Parameters

```javascript
{
  image_url: artwork.generated_image_url,
  prompt: "masterpiece, best quality, highres, visible paintstroke texture, oil painting style",
  upscale_factor: 3,  // 3x resolution increase
  negative_prompt: "(worst quality, low quality, normal quality:2), blurry, pixelated, artifacts",
  creativity: 0.35,   // Balanced enhancement
  resemblance: 0.8,   // High fidelity to original
  guidance_scale: 4,
  num_inference_steps: 18,
  enable_safety_checker: true
}
```

### Quality Targets

- **Input**: ~1024x1024 generated artwork
- **Output**: ~3072x3072 upscaled image (3x factor)
- **Target DPI**: 300 DPI for print quality
- **File Format**: JPEG/PNG (maintained from original)

## Order Processing Integration

### Enhanced Workflow

1. **Payment Completion**: Stripe webhook triggers order processing
2. **Product Type Check**: 
   - Digital products: Mark upscale_status as 'not_required'
   - Physical products: Proceed with upscaling
3. **Upscaling Process**:
   - Call `/api/upscale` with artwork ID
   - Update status to 'processing'
   - Wait for fal.ai completion
   - Store upscaled image URL
4. **Printify Integration**: Use upscaled image for product creation
5. **Fallback Handling**: Use original image if upscaling fails

### Code Integration Points

```typescript
// In order-processing.ts
if (productType === ProductType.DIGITAL) {
  await updateArtworkUpscaleStatus(artwork_id, 'not_required');
  return;
}

// For physical products
try {
  finalImageUrl = await triggerUpscaling(artwork_id);
  await addOrderStatusHistory(order.id, 'processing', 'Image upscaled successfully');
} catch (upscaleError) {
  console.warn('Upscaling failed, using original image');
  finalImageUrl = originalImageUrl; // Fallback
}
```

## Error Handling & Fallbacks

### Upscaling Failure Scenarios

1. **fal.ai Service Unavailable**
   - Status: Mark as 'failed'
   - Action: Use original image for Printify
   - Logging: Log error details for monitoring

2. **Invalid Image URL**
   - Status: Mark as 'failed'
   - Action: Use original image
   - Prevention: Validate URLs before upscaling

3. **Timeout Issues**
   - Status: Mark as 'failed' after timeout
   - Action: Use original image
   - Retry: Could implement retry logic for transient failures

### Graceful Degradation

```typescript
try {
  const upscaledUrl = await triggerUpscaling(artworkId);
  return upscaledUrl;
} catch (error) {
  console.warn('Upscaling failed, using original:', error);
  await updateArtworkUpscaleStatus(artworkId, 'failed');
  return originalImageUrl; // Always have a fallback
}
```

## Performance Considerations

### Processing Time

- **Upscaling Duration**: 30-90 seconds per image
- **Order Processing**: Non-blocking for customer experience
- **Printify Creation**: Waits for upscaling completion

### Optimization Strategies

1. **Caching**: Store upscaled images permanently
2. **Batch Processing**: Process multiple upscales in parallel
3. **Monitoring**: Track success rates and processing times
4. **Queue Management**: Handle high-volume periods

## Monitoring & Analytics

### Key Metrics

- **Upscaling Success Rate**: % of successful upscales
- **Processing Time**: Average time per upscale
- **Fallback Rate**: % using original images
- **Quality Improvement**: Customer satisfaction metrics

### Database Queries

```sql
-- Success rate monitoring
SELECT 
  upscale_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM artworks 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY upscale_status;

-- Processing time analysis
SELECT 
  AVG(EXTRACT(EPOCH FROM (upscaled_at - created_at))) as avg_processing_seconds
FROM artworks 
WHERE upscale_status = 'completed'
AND upscaled_at IS NOT NULL;
```

## Testing

### Unit Tests

- **API Endpoint Testing**: `/tests/api/upscale.test.ts`
- **Database Operations**: Supabase artwork functions
- **Error Handling**: Various failure scenarios

### Integration Tests

- **Order Processing**: `/tests/backend/order-processing-upscale.test.ts`
- **End-to-End Flow**: Purchase → Upscale → Printify
- **Fallback Scenarios**: Upscaling failures

### Test Coverage

- ✅ Successful upscaling flow
- ✅ Already upscaled detection
- ✅ Error handling and fallbacks
- ✅ Digital product skipping
- ✅ Database status updates
- ✅ Printify integration with upscaled images

## Environment Variables

```bash
# Required for upscaling
FAL_KEY=your_fal_ai_api_key
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Existing variables (still required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PRINTIFY_API_TOKEN=your_printify_token
PRINTIFY_SHOP_ID=your_shop_id
```

## Deployment Checklist

### Database Migration

1. ✅ Add upscaling columns to artworks table
2. ✅ Create performance indexes
3. ✅ Update RLS policies if needed
4. ✅ Test database functions

### Code Deployment

1. ✅ Deploy upscaling API endpoint
2. ✅ Update order processing logic
3. ✅ Update Supabase artwork functions
4. ✅ Deploy comprehensive tests

### Configuration

1. ✅ Set FAL_KEY environment variable
2. ✅ Configure NEXT_PUBLIC_BASE_URL
3. ✅ Verify Printify integration
4. ✅ Test end-to-end flow

## Future Enhancements

### Potential Improvements

1. **Batch Upscaling**: Process multiple images simultaneously
2. **Quality Presets**: Different upscaling settings per product type
3. **A/B Testing**: Compare upscaled vs original print quality
4. **Retry Logic**: Automatic retry for transient failures
5. **Progress Tracking**: Real-time upscaling progress for customers

### Scaling Considerations

- **Queue System**: Redis/Bull for high-volume processing
- **CDN Integration**: CloudFront for upscaled image delivery
- **Cost Optimization**: Monitor fal.ai usage and costs
- **Regional Processing**: Edge computing for faster upscaling

## Troubleshooting

### Common Issues

1. **Upscaling Always Fails**
   - Check FAL_KEY environment variable
   - Verify fal.ai service status
   - Check image URL accessibility

2. **Slow Processing**
   - Monitor fal.ai queue times
   - Check network connectivity
   - Verify image sizes (large images take longer)

3. **Database Errors**
   - Check Supabase connection
   - Verify service role permissions
   - Check column exists after migration

### Debug Commands

```bash
# Check upscaling status
curl -X GET "https://your-domain.com/api/upscale?artworkId=uuid"

# Trigger manual upscaling
curl -X POST "https://your-domain.com/api/upscale" \
  -H "Content-Type: application/json" \
  -d '{"artworkId": "uuid"}'

# Database status check
SELECT upscale_status, COUNT(*) FROM artworks GROUP BY upscale_status;
```

## Security Considerations

### Access Control

- **API Endpoints**: Internal use only (no public access)
- **Database**: Service role required for upscaling operations
- **Image URLs**: Validate before processing
- **Rate Limiting**: Prevent abuse of upscaling endpoint

### Data Protection

- **Image Storage**: Temporary processing, permanent storage via fal.ai
- **Metadata**: No sensitive data in upscaling requests
- **Logging**: Avoid logging sensitive customer information

---

**Implementation Status**: ✅ Complete
**Last Updated**: September 8, 2024
**Next Review**: Monitor success rates and performance metrics

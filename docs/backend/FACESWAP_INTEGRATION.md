# FaceSwap Integration with ViewComfy

## Overview

The FaceSwap integration adds an additional step to the PawPop artwork generation pipeline, using ViewComfy to run ComfyUI workflows for face replacement. This step occurs between MonaLisa generation and pet integration, improving the quality of the final artwork by ensuring better face matching.

## Architecture

### Generation Pipeline Flow

```
1. User Upload → UploadThing
2. MonaLisa Generation → fal.ai Flux Kontext LoRA
3. **FaceSwap → ViewComfy ComfyUI** ← NEW STEP
4. Pet Integration → fal.ai Flux Pro Kontext Max Multi  
5. Upscaling → fal.ai clarity-upscaler
6. Mockup Generation → Printify API
```

### Database Schema Changes

The `artworks` table has been updated to include:

```sql
-- New generation step enum value
generation_step: 'pending' | 'monalisa_generation' | 'faceswap' | 'pet_integration' | 'upscaling' | 'mockup_generation' | 'completed' | 'failed'

-- New JSONB field in generated_images
generated_images: {
  "monalisa_base": "url_to_monalisa_portrait",
  "faceswap_result": "url_to_faceswapped_portrait", // NEW
  "artwork_preview": "url_to_preview_image",
  "artwork_full_res": "url_to_full_resolution_image",
  "generation_steps": []
}
```

## ViewComfy Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# ViewComfy Configuration (for FaceSwap using ComfyUI)
VIEWCOMFY_API_URL=https://api.viewcomfy.com/v1
VIEWCOMFY_CLIENT_ID=your_viewcomfy_client_id
VIEWCOMFY_CLIENT_SECRET=your_viewcomfy_client_secret

# Admin Review System Configuration
ADMIN_EMAIL=pawpopart@gmail.com

# Monitoring System Configuration
# Alert thresholds for system monitoring
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_SUPABASE_QUERY_TIME_THRESHOLD=5000
MONITORING_SUPABASE_ERROR_RATE_THRESHOLD=5
MONITORING_FAL_DAILY_COST_THRESHOLD=50
MONITORING_FAL_MONTHLY_COST_THRESHOLD=1000
MONITORING_FAL_ERROR_RATE_THRESHOLD=10
MONITORING_STRIPE_SUCCESS_RATE_THRESHOLD=95
MONITORING_STRIPE_PAYMENT_SUCCESS_RATE_THRESHOLD=98
```

### ViewComfy Setup

1. **Create ViewComfy Account**: Sign up at [ViewComfy Dashboard](https://app.viewcomfy.com)
2. **Deploy ComfyUI Workflow**: Upload your faceswap workflow to ViewComfy
3. **Get API Credentials**: Generate client ID and secret from dashboard
4. **Configure Workflow Parameters**: Ensure your workflow accepts:
   - `source_image_input`: Pet mom photo URL
   - `target_image_input`: MonaLisa portrait URL

## API Endpoints

### POST /api/faceswap

Performs face replacement using ViewComfy ComfyUI workflow.

**Request Body:**
```json
{
  "sourceImageUrl": "https://example.com/pet-mom-photo.jpg",
  "targetImageUrl": "https://example.com/monalisa-portrait.jpg", 
  "artworkId": "artwork-uuid-123"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://supabase.co/storage/faceswap-result.jpg",
  "viewcomfyUrl": "https://viewcomfy.com/output/faceswap-result.jpg",
  "supabaseUrl": "https://supabase.co/storage/faceswap-result.jpg"
}
```

**Error Responses:**
- `400`: Missing required parameters
- `500`: ViewComfy configuration error
- `503`: ViewComfy service temporarily unavailable

## Implementation Details

### ViewComfy Client Library

The `ViewComfyClient` class handles:

- **Authentication**: OAuth2 client credentials flow
- **Token Management**: Automatic token refresh and caching
- **Workflow Execution**: ComfyUI workflow parameter mapping
- **Error Handling**: Comprehensive error handling and retries
- **Monitoring**: Usage tracking and performance metrics

### Key Classes and Functions

```typescript
// Main client class
class ViewComfyClient {
  async executeWorkflow(params: ViewComfyParams): Promise<ViewComfyResult>
  async executeFaceSwap(params: FaceSwapParams): Promise<string>
}

// Convenience functions
function createViewComfyClient(): ViewComfyClient
function performFaceSwap(params: FaceSwapParams): Promise<string>
```

### Integration Points

1. **UploadModal.tsx**: Updated generation pipeline to include faceswap step
2. **Supabase Storage**: Faceswap results stored in organized structure
3. **Monitoring**: Usage tracking for cost and performance monitoring
4. **Error Handling**: Graceful fallback to original MonaLisa if faceswap fails

## Workflow Parameters

Your ComfyUI workflow should accept these parameters:

```json
{
  "source_image_input": "https://example.com/pet-mom-photo.jpg",
  "target_image_input": "https://example.com/monalisa-portrait.jpg"
}
```

**Parameter Mapping:**
- `source_image_input`: The pet mom's photo (source face)
- `target_image_input`: The MonaLisa portrait (target image)

## Error Handling & Fallbacks

### Graceful Degradation

If faceswap fails, the system continues with the original MonaLisa portrait:

```typescript
let faceswapImageUrl = monaLisaImageUrl; // Fallback to original
if (faceswapResponse.ok) {
  const faceswapResult = await faceswapResponse.json();
  faceswapImageUrl = faceswapResult.imageUrl;
} else {
  console.warn('FaceSwap failed, continuing with original MonaLisa portrait');
}
```

### Error Types

1. **Configuration Errors**: Missing environment variables
2. **Authentication Errors**: Invalid client credentials
3. **Workflow Errors**: ComfyUI execution failures
4. **Network Errors**: ViewComfy service unavailable
5. **Storage Errors**: Supabase storage failures (with fallback)

## Monitoring & Analytics

### Usage Tracking

The system tracks:
- FaceSwap request count and success rate
- Processing time and cost per request
- Error rates and failure reasons
- ViewComfy API response times

### Monitoring Integration

FaceSwap operations are integrated with the comprehensive monitoring system:

**Automated Alerts:**
- High error rates (>10% threshold)
- Cost threshold breaches ($50 daily, $1000 monthly)
- Processing time anomalies
- Service availability issues

**Email Notifications:**
- All alerts sent to configured admin email (pawpopart@gmail.com)
- Color-coded severity levels (Critical, High, Medium, Low)
- Actionable troubleshooting information included

**Monitoring Dashboard:**
- Real-time FaceSwap success rates
- Cost tracking and projections
- Performance metrics and trends
- Error analysis and debugging data

### Cost Estimation

- **ViewComfy Cost**: ~$0.08 per faceswap operation
- **Processing Time**: 30-60 seconds typical
- **Success Rate**: Target >95% success rate
- **Daily Cost Alert**: Triggers at $50 threshold
- **Monthly Cost Alert**: Triggers at $1000 threshold

## Testing

### Unit Tests

```bash
# Run faceswap-specific tests
npm run test tests/api/faceswap.test.ts
npm run test tests/lib/viewcomfy.test.ts

# Run full test suite
npm run test
```

### Test Coverage

- ✅ ViewComfy client authentication
- ✅ Workflow execution success/failure
- ✅ API endpoint validation
- ✅ Error handling scenarios
- ✅ Fallback mechanisms
- ✅ Storage integration

## Database Migration

Apply the faceswap schema changes:

```bash
# Apply migration
npm run migration:apply 009_add_faceswap_step.sql

# Rollback if needed
npm run migration:rollback 009_rollback_add_faceswap_step.sql
```

### Helper Functions

The migration adds these database functions:

```sql
-- Get artworks needing faceswap processing
SELECT * FROM get_artworks_needing_faceswap();

-- Update faceswap result
SELECT update_artwork_faceswap_result('artwork-uuid', 'https://result-url.jpg');
```

## Production Deployment

### Prerequisites

1. ✅ ViewComfy account and deployed workflow
2. ✅ Environment variables configured (ViewComfy + Monitoring)
3. ✅ Database migration applied (faceswap + monitoring schemas)
4. ✅ ComfyUI workflow tested and validated
5. ✅ Admin email configured for monitoring alerts

### Deployment Steps

1. **Deploy Code**: Deploy updated codebase with faceswap integration
2. **Apply Migrations**: 
   ```bash
   npm run migration:apply 008_monitoring_system.sql
   npm run migration:apply 009_add_faceswap_step.sql
   ```
3. **Configure Environment**: Set all required environment variables:
   - ViewComfy credentials (API URL, Client ID, Secret)
   - Admin email for alerts (pawpopart@gmail.com)
   - Monitoring thresholds (cost, error rates, performance)
4. **Test Monitoring**: Run monitoring system test to verify alerts
   ```bash
   npm run test:monitoring
   ```
5. **Monitor**: Watch logs and metrics for successful integration
6. **Validate**: Test end-to-end generation pipeline with faceswap

### Rollback Plan

If issues occur:

1. **Disable FaceSwap**: Set environment variables to empty to skip step
2. **Rollback Migration**: Apply rollback SQL to remove schema changes
3. **Revert Code**: Deploy previous version without faceswap integration

## Troubleshooting

### Common Issues

**"Missing ViewComfy configuration"**
- Ensure all environment variables are set
- Verify client ID and secret are correct

**"ViewComfy API error: 401 Unauthorized"**
- Check client credentials
- Verify ViewComfy account is active

**"No output images generated from faceswap"**
- Check ComfyUI workflow configuration
- Verify workflow parameters match expected names

**"FaceSwap service temporarily unavailable"**
- ViewComfy service may be down
- System will fallback to original MonaLisa portrait
- Check monitoring dashboard for service status alerts

**High FaceSwap Error Rates**
- Monitor alerts will trigger at >10% error rate
- Check ViewComfy service status and API limits
- Review ComfyUI workflow configuration
- Verify image format compatibility

### Debug Logging

Enable detailed logging:

```typescript
console.log('🔄 Running faceswap with ViewComfy...');
console.log('📊 FaceSwap params:', { artworkId, hasSourceImage, hasTargetImage });
```

### Monitoring Dashboard Access

Check system health and FaceSwap metrics:

```bash
# Check monitoring system status
npm run test:monitoring

# View monitoring dashboard data
curl -X GET http://localhost:3000/api/monitoring/dashboard
```

## Performance Considerations

### Optimization Strategies

1. **Token Caching**: Reuse access tokens for 50 minutes
2. **Parallel Processing**: FaceSwap runs independently of other steps
3. **Fallback Strategy**: Continue pipeline even if faceswap fails
4. **Storage Optimization**: Store results in Supabase for faster access

### Scaling Considerations

- **Rate Limits**: ViewComfy may have API rate limits
- **Cost Management**: Monitor usage to control costs
- **Performance**: Typical 30-60 second processing time
- **Reliability**: 95%+ success rate target

## Future Enhancements

### Potential Improvements

1. **Multiple Face Detection**: Handle multiple faces in source image
2. **Quality Scoring**: Automatic quality assessment of faceswap results
3. **A/B Testing**: Compare with/without faceswap for quality metrics
4. **Batch Processing**: Process multiple artworks simultaneously
5. **Custom Workflows**: Support different ComfyUI workflows per use case

### Integration Opportunities

- **Real-time Preview**: Show faceswap preview during generation
- **User Feedback**: Collect user ratings on faceswap quality
- **Advanced Controls**: Allow users to adjust faceswap strength
- **Multi-step Refinement**: Multiple faceswap passes for better quality

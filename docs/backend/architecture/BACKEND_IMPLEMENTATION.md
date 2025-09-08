# PawPop Backend Implementation

## Overview
Complete Supabase backend implementation with UploadThing integration for PawPop's artwork generation and order processing system.

## Architecture

### Database Schema
- **artworks**: Core artwork records with access tokens for secure sharing
- **orders**: Order management with Stripe and Printify integration
- **order_status_history**: Audit trail for order status changes
- **users**: User management (optional, supports anonymous orders)

### Key Features
- ✅ Secure access token system for artwork sharing
- ✅ Row Level Security (RLS) policies
- ✅ Service role access for webhooks
- ✅ Comprehensive indexing for performance
- ✅ Automatic timestamp management
- ✅ Order status tracking and history

## File Structure

### Core Libraries
```
src/lib/
├── supabase.ts              # Client configuration and types
├── supabase-artworks.ts     # Artwork management utilities
├── supabase-orders.ts       # Order management utilities (updated)
└── utils.ts                 # Helper functions and validation
```

### API Endpoints
```
src/app/api/
├── uploadthing/
│   ├── core.ts              # UploadThing configuration
│   └── route.ts             # UploadThing route handler
├── artwork/
│   ├── create/route.ts      # Create new artwork
│   ├── update/route.ts      # Update artwork status/images
│   ├── status/route.ts      # Get artworks by status
│   └── [token]/route.ts     # Get artwork by access token (existing)
└── upload/
    └── complete/route.ts    # Handle upload completion
```

## API Reference

### Artwork Management

#### POST /api/artwork/create
Create a new artwork record.
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "original_image_url": "https://...",
  "pet_name": "Buddy" // optional
}
```

#### PATCH /api/artwork/update
Update artwork with generated images or status.
```json
{
  "artwork_id": "uuid",
  "generated_image_url": "https://...",
  "generation_status": "completed"
}
```

#### GET /api/artwork/status?status=pending
Get artworks by generation status (pending/completed/failed).

#### POST /api/upload/complete
Handle UploadThing upload completion.
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "pet_name": "Buddy",
  "uploaded_file_url": "https://..."
}
```

### UploadThing Configuration

#### Pet Photo Uploader
- Max file size: 8MB
- File types: Images only
- Metadata: customer info and pet name

#### Pet Mom Uploader
- For 2-step artwork process
- Links to existing artwork via artwork_id

## Database Functions

### get_order_with_artwork(session_id)
Retrieves complete order information with artwork details.

### get_failed_orders()
Returns orders that need Printify fulfillment retry.

## Security Features

### Row Level Security
- Users can only access their own artworks
- Service role has full access for webhooks
- Anonymous access via secure tokens

### Access Tokens
- 32-byte secure random tokens
- 30-day expiration (configurable)
- Unique constraint prevents duplicates

## Environment Variables

Required environment variables (see `.env.example`):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Other integrations
STRIPE_SECRET_KEY=sk_test_...
PRINTIFY_API_TOKEN=your_token
FAL_API_KEY=your_fal_key
```

## Integration Points

### With Existing Systems
- **Stripe Integration**: Updated order processing to use new schema
- **Printify Integration**: Enhanced with better error handling
- **FAL.ai Integration**: Ready for artwork generation pipeline

### User Flow Integration
1. User uploads pet photo via UploadThing
2. Artwork record created with access token
3. FAL.ai generates MonaLisa artwork
4. Customer selects product and completes Stripe checkout
5. Order processing triggers Printify fulfillment
6. Status updates tracked in order history

## Performance Optimizations

### Database Indexes
- `idx_artworks_token`: Fast token lookups
- `idx_artworks_email`: Customer artwork queries
- `idx_artworks_status`: Generation status filtering
- `idx_orders_stripe_session`: Webhook processing
- `idx_orders_printify`: Fulfillment status updates

### Query Optimization
- Selective field returns in API responses
- Proper JOIN usage in utility functions
- Efficient status filtering

## Error Handling

### Validation
- Email format validation
- UUID format validation
- Required field checking
- File type validation

### Error Responses
- Consistent JSON error format
- Appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful fallbacks

## Testing Integration

The backend is ready for integration with the existing test suite:
- Unit tests for utility functions
- Integration tests for API endpoints
- Contract tests for database schema
- End-to-end tests for complete workflows

## Deployment Checklist

1. ✅ Run Supabase schema migration
2. ✅ Configure environment variables
3. ✅ Set up UploadThing project
4. ✅ Test database connections
5. ✅ Verify RLS policies
6. ✅ Test API endpoints
7. ✅ Configure webhook endpoints

## Next Steps

The backend is production-ready and integrates seamlessly with:
- Existing Printify fulfillment system
- Stripe payment processing
- FAL.ai artwork generation
- Frontend components and modals

All components follow the PRD requirements and support the "handcrafted human-in-the-loop" product positioning.

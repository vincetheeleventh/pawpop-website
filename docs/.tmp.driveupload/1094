# Manual Upload Feature for Admin Reviews

## Overview

The manual upload feature allows administrators to replace automatically generated artwork images with manually uploaded images during the review process. This provides quality control and the ability to use custom artwork when the AI generation doesn't meet standards.

## Features Implemented

### 1. Source Images Display
- **Location**: `/admin/reviews/[reviewId]` page
- **Functionality**: Displays the original user-uploaded photos (pet mom photo + pet photo) that were used for generation
- **Purpose**: Helps admin make informed decisions by seeing the source material

### 2. Manual Upload Interface
- **Location**: Admin review detail page, in the "Review Decision" section
- **Components**:
  - File input for image selection
  - "Manual Upload Proof Image" button
  - Progress indicators and validation
- **Behavior**: 
  - Replaces the generated image with admin-uploaded image
  - Automatically approves the review
  - Sends completion email to customer

### 3. API Endpoint
- **Endpoint**: `POST /api/admin/reviews/[reviewId]/manual-upload`
- **Parameters**:
  - `image`: File (required) - The replacement image
  - `reviewId`: String (required) - The review ID
  - `notes`: String (optional) - Admin notes
  - `reviewedBy`: String (required) - Admin identifier
- **Response**: Success/error status and new image URL

## Technical Implementation

### Database Schema
```sql
-- Added to admin_reviews table
ALTER TABLE admin_reviews 
ADD COLUMN manually_replaced BOOLEAN DEFAULT FALSE;
```

### File Storage
- Images stored in Supabase Storage under `artwork-images` bucket
- Filename format: `{artwork_id}/manual_upload_{timestamp}.jpg`
- Public URLs generated for immediate access

### Workflow
1. Admin selects replacement image
2. Image uploaded to Supabase Storage
3. Artwork record updated with new image URLs
4. Review marked as approved with `manually_replaced = true`
5. Customer receives completion email with new image

## API Integration

### AdminReview Interface Updates
```typescript
interface AdminReview {
  // ... existing fields
  source_images?: {
    pet_mom_photo?: string
    pet_photo?: string
  }
  manually_replaced?: boolean
}
```

### Key Functions
- `getAdminReview()`: Enhanced to include source images
- `handleManualUpload()`: Frontend function for file upload
- Manual upload API: Handles file processing and approval

## Testing

### Test Coverage
- Source images display functionality
- Manual upload API endpoint
- File validation and error handling
- Review approval workflow
- Integration with existing email system

### Test Files
- `/tests/api/manual-upload.test.ts`: Comprehensive API tests
- Manual testing with real image uploads

## Usage

### For Administrators
1. Navigate to `/admin/reviews`
2. Click on a pending review
3. Review the original source images
4. If needed, select "Manual Upload Proof Image"
5. Choose replacement image and click upload
6. Review is automatically approved and customer notified

### Environment Configuration
No additional configuration required. Uses existing:
- `ENABLE_HUMAN_REVIEW=true` for manual approval system
- Supabase storage credentials
- Email notification settings

## Security Considerations

- File type validation (images only)
- File size limits enforced by Supabase
- Admin authentication required
- Audit trail maintained in database
- Secure file storage with public URLs

## Future Enhancements

Potential improvements:
- Image resizing/optimization before storage
- Multiple image upload support
- Batch processing capabilities
- Enhanced audit logging
- Admin user management integration

## Migration Files

- `013_add_manual_replacement_tracking.sql`: Adds tracking column
- `013_rollback_manual_replacement_tracking.sql`: Rollback script

## Related Files

### Frontend
- `/src/app/admin/reviews/[reviewId]/page.tsx`: Review detail page with upload UI
- `/src/lib/admin-review.ts`: Enhanced interface and functions

### Backend
- `/src/app/api/admin/reviews/[reviewId]/manual-upload/route.ts`: Upload API
- `/supabase/migrations/013_add_manual_replacement_tracking.sql`: Database schema

### Tests
- `/tests/api/manual-upload.test.ts`: Comprehensive test suite

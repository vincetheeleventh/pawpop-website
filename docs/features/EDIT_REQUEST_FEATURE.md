# Edit Request Feature

## Overview

The Edit Request feature allows customers to request modifications to their completed artwork, giving them control over the final result while enabling quality feedback collection. Customers can submit up to 2 edit requests per artwork.

## User Flow

### Customer Experience

1. **View Completed Artwork**: Customer navigates to their artwork page after generation is complete
2. **Request Edits Button**: Below the artwork image, a "Request Edits" button is prominently displayed
3. **Edit Request Modal**: 
   - Customer sees their artwork preview
   - Current request status (X of 2 used)
   - Simple textarea for describing desired changes
   - Helpful examples and guidelines
4. **Submit Request**: Customer submits their edit request
5. **Confirmation**: Success message confirms submission
6. **Email Notification**: Customer receives confirmation that request was submitted

### Admin Experience

1. **Email Notification**: Admin receives email when edit request is created
2. **Review Dashboard**: Edit requests appear in admin dashboard with orange "Edit Request" badge
3. **View Request**: Admin sees:
   - Current artwork image
   - Customer's edit request text (prominently displayed in orange box)
   - Customer and pet information
   - FAL.ai generation reference
4. **Process Request**: Admin reviews, makes changes, and approves/rejects

## Technical Implementation

### Database Schema

**Migration**: `015_add_edit_request_support.sql`

```sql
-- Added to admin_reviews table
edit_request_text TEXT  -- Customer's edit request description

-- Updated review_type constraint
review_type IN ('artwork_proof', 'highres_file', 'edit_request')

-- Added to artworks table  
edit_request_count INTEGER DEFAULT 0  -- Track request limit (max 2)
```

### API Endpoints

#### POST /api/artwork/request-edit
Submit an edit request for an artwork.

**Request Body**:
```json
{
  "artwork_id": "uuid",
  "edit_request_text": "string (max 1000 chars)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Edit request submitted successfully",
  "review_id": "uuid",
  "edit_request_count": 1,
  "max_requests": 2,
  "remaining_requests": 1
}
```

**Validations**:
- Artwork must be completed (`generation_step === 'completed'`)
- Edit request count must be < 2
- Request text required and non-empty
- Request text must be ≤ 1000 characters

#### GET /api/artwork/request-edit?artwork_id=uuid
Get edit request status for an artwork.

**Response**:
```json
{
  "success": true,
  "edit_request_count": 1,
  "max_requests": 2,
  "remaining_requests": 1,
  "can_request_edit": true
}
```

### Components

#### RequestEditModal
**Location**: `/src/components/modals/RequestEditModal.tsx`

**Props**:
```typescript
{
  isOpen: boolean
  onClose: () => void
  artworkId: string
  artworkImageUrl: string
}
```

**Features**:
- Artwork preview
- Request status display (X of 2 used)
- Textarea with character counter (1000 max)
- Helpful instructions and examples
- Success state after submission
- Automatic modal close after success

#### Artwork Page Integration
**Location**: `/src/app/artwork/[token]/page.tsx`

- "Request Edits" button below artwork image
- Opens RequestEditModal on click
- Subtitle: "Not quite perfect? Let us know what to adjust"

### Admin Dashboard Updates

**Location**: `/src/app/admin/reviews/page.tsx`

**Changes**:
1. Added "Edit Requests" filter tab
2. Orange badge for edit request type
3. Edit request text displayed in prominent orange box
4. Full integration with existing review workflow

**Email Notification**:
- Includes customer's edit request text
- Sent to admin email (pawpopart@gmail.com)
- Uses existing admin review email template

## User Experience Design

### Request Limits
- **Maximum**: 2 edit requests per artwork
- **Purpose**: Prevent abuse while allowing quality iteration
- **Display**: Shows "X of 2 used" and remaining requests

### UI/UX Highlights

**Request Button**:
- Border-style button (not primary CTA)
- Positioned below artwork, before purchase options
- Clear call-to-action: "Request Edits ✏️"

**Modal Design**:
- Clean, focused interface
- Artwork preview for context
- Helpful guidelines with examples
- Character counter for feedback
- Success state with clear messaging

**Admin Dashboard**:
- Orange color scheme for edit requests (distinct from artwork_proof and highres_file)
- Request text prominently displayed
- Easy to distinguish from other review types

## Configuration

### Environment Variables
No new environment variables required. Uses existing:
- `ENABLE_HUMAN_REVIEW` - Controls if edit requests create admin reviews
- `ADMIN_EMAIL` - Email address for admin notifications

### Request Limits
Defined in `/src/app/api/artwork/request-edit/route.ts`:
```typescript
const MAX_EDIT_REQUESTS = 2
```

## Testing

### Manual Testing Flow

1. **Submit Edit Request**:
   ```bash
   # Complete an artwork first
   # Navigate to artwork page
   # Click "Request Edits"
   # Enter edit request text
   # Submit
   ```

2. **Verify Admin Notification**:
   - Check pawpopart@gmail.com for email
   - Verify edit request text is included
   - Check admin dashboard shows new review

3. **Test Request Limits**:
   - Submit 2 edit requests
   - Verify 3rd request is blocked
   - Check error message displays correctly

4. **Admin Approval Flow**:
   - Admin approves edit request
   - Verify workflow completion
   - Check customer receives updated artwork

### Edge Cases Handled

- ✅ Artwork not completed yet
- ✅ Request limit exceeded (2 max)
- ✅ Empty edit request text
- ✅ Text exceeds 1000 characters
- ✅ Artwork not found
- ✅ Database errors
- ✅ Email sending failures (non-blocking)

## Production Considerations

### Performance
- Minimal database impact (1 insert, 1 update per request)
- Request limit check prevents spam
- Character limit prevents database bloat

### Security
- Artwork ID validation
- SQL injection prevention (parameterized queries)
- Input sanitization (trim, max length)
- Authentication via existing admin system

### Scalability
- 2-request limit prevents abuse
- Text stored in database (not file system)
- Existing admin review infrastructure

## Future Enhancements

**Potential Improvements**:
1. **Visual Markup**: Allow customers to annotate/circle areas on image
2. **Version History**: Track all versions of artwork
3. **Reference Image Upload**: Let customers upload reference photos
4. **Status Tracking**: Show request status to customers
5. **Guided Questions**: Structured form instead of free-form text
6. **After-Purchase Requests**: Handle edit requests after purchase

## Files Modified

### New Files
- `/supabase/migrations/015_add_edit_request_support.sql`
- `/supabase/rollbacks/015_rollback_edit_request_support.sql`
- `/src/app/api/artwork/request-edit/route.ts`
- `/src/components/modals/RequestEditModal.tsx`
- `/docs/features/EDIT_REQUEST_FEATURE.md` (this file)

### Modified Files
- `/src/lib/admin-review.ts` - Added edit_request type support
- `/src/lib/email.ts` - Updated email templates for edit requests
- `/src/app/artwork/[token]/page.tsx` - Added Request Edits button and modal
- `/src/app/admin/reviews/page.tsx` - Added edit request filter and display

## Migration Instructions

1. **Apply Database Migration**:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/015_add_edit_request_support.sql
   ```

2. **Deploy Application**:
   ```bash
   git add .
   git commit -m "feat: add edit request feature with 2-request limit"
   git push origin main
   ```

3. **Verify Deployment**:
   - Test edit request submission
   - Check admin dashboard displays correctly
   - Verify email notifications work

4. **Rollback (if needed)**:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/rollbacks/015_rollback_edit_request_support.sql
   ```

## Support & Troubleshooting

### Common Issues

**Issue**: Edit request not showing in admin dashboard
- **Solution**: Check `ENABLE_HUMAN_REVIEW` environment variable

**Issue**: Email not received
- **Solution**: Check `ADMIN_EMAIL` environment variable and Resend configuration

**Issue**: Can't submit edit request
- **Solution**: Verify artwork is completed and request limit not exceeded

### Logging

Key log messages to monitor:
- `✅ Edit request created for artwork {id} ({count}/{MAX_EDIT_REQUESTS})`
- `✅ Admin review notification sent for review {id}`
- `❌ Error creating edit request: {error}`

## Conclusion

The Edit Request feature provides customers with control over their artwork while giving PawPop valuable quality feedback. The 2-request limit prevents abuse while allowing reasonable iteration, and the admin integration ensures smooth processing without disrupting existing workflows.

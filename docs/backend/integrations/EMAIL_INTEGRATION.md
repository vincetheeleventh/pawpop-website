# Email Integration with Resend

This document describes the complete email integration implementation for PawPop using Resend as the email service provider.

## Overview

The email system sends automated notifications at key points in the customer journey:

1. **Masterpiece Being Created** - Immediately after photo upload and email capture
2. **Masterpiece Ready** - When AI artwork generation completes
3. **Order Confirmation** - After successful payment for prints
4. **Shipping Notification** - When Printify ships the order

## Architecture

### Core Components

- **Email Service** (`/src/lib/email.ts`) - Main email functionality with Resend integration
- **API Integration Points** - Email triggers in existing API endpoints
- **Email Templates** - HTML email templates with responsive design
- **Error Handling** - Graceful degradation when emails fail

### Email Flow Diagram

```
Photo Upload → Upload Complete API → "Masterpiece Being Created" Email
     ↓
AI Generation → Artwork Update API → "Masterpiece Ready" Email
     ↓
Purchase → Stripe Webhook → "Order Confirmation" Email
     ↓
Shipping → Printify Webhook → "Shipping Notification" Email
```

## Implementation Details

### 1. Email Service (`/src/lib/email.ts`)

The core email service provides:

- **Resend Integration** - Configured with API key and default sender
- **Email Templates** - Beautiful HTML templates with PawPop branding
- **Type Safety** - TypeScript interfaces for all email data
- **Error Handling** - Comprehensive error handling and logging

#### Key Functions

```typescript
// Send any email
sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }>

// Send masterpiece creating email
sendMasterpieceCreatingEmail(data: MasterpieceCreatingEmailData): Promise<{ success: boolean; error?: string }>

// Send masterpiece ready email
sendMasterpieceReadyEmail(data: MasterpieceReadyEmailData): Promise<{ success: boolean; error?: string }>

// Send order confirmation email
sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<{ success: boolean; error?: string }>

// Send shipping notification email
sendShippingNotificationEmail(data: ShippingNotificationEmailData): Promise<{ success: boolean; error?: string }>
```

### 2. Integration Points

#### Upload Complete (`/src/app/api/upload/complete/route.ts`)
- **Trigger**: After successful photo upload and artwork record creation
- **Email**: "Your masterpiece is being created"
- **Data**: Customer name, email, pet name, artwork URL

#### Artwork Update (`/src/app/api/artwork/update/route.ts`)
- **Trigger**: When generation_status changes to 'completed'
- **Email**: "Your masterpiece is ready"
- **Data**: Customer info, artwork URL, generated image URL

#### Stripe Webhook (`/src/app/api/webhook/route.ts`)
- **Trigger**: On 'checkout.session.completed' event
- **Email**: Order confirmation
- **Data**: Order details, customer info, product type, amount

#### Printify Webhook (`/src/app/api/webhook/printify/route.ts`)
- **Trigger**: On 'order:shipment:created' event
- **Email**: Shipping notification
- **Data**: Tracking info, customer details, order number

### 3. Email Templates

All emails feature:
- **Responsive Design** - Mobile-optimized layouts
- **PawPop Branding** - Consistent colors and styling
- **Professional Layout** - Header, content, footer structure
- **Call-to-Action Buttons** - Clear next steps for customers

#### Template Features
- Gradient headers with PawPop colors
- Clean typography with proper spacing
- Branded footer with contact information
- Conditional content based on data availability

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxx

# Optional (defaults to pawpopart.com)
NEXT_PUBLIC_BASE_URL=https://pawpopart.com
```

### Resend Setup

1. **Create Resend Account** at [resend.com](https://resend.com)
2. **Verify Domain** - Add pawpopart.com to Resend
3. **Generate API Key** - Create API key with send permissions
4. **Configure DNS** - Add required DNS records for domain verification

### Domain Configuration

The system uses `pawpopart.com` as the sender domain:
- **From Address**: `PawPop <noreply@pawpopart.com>`
- **Reply-To**: Customers can reply to emails
- **Domain Verification**: Required for deliverability

## Email Content

### 1. Masterpiece Being Created Email

**Subject**: "Your masterpiece is being created! 🎨"

**Content**:
- Welcome message with customer name
- Explanation of the AI art process
- Timeline expectations (2-5 minutes)
- Link to check artwork status
- Next steps information

### 2. Masterpiece Ready Email

**Subject**: "Your masterpiece is ready! 🎉"

**Content**:
- Celebration of completion
- Preview of generated artwork
- Call-to-action buttons (View Artwork, Order Prints)
- Available print options
- 30-day link expiration notice

### 3. Order Confirmation Email

**Subject**: "Order Confirmation #[ORDER_NUMBER] - PawPop"

**Content**:
- Order details table
- Product information and pricing
- Production and shipping timeline
- Customer service contact info

### 4. Shipping Notification Email

**Subject**: "Your PawPop order #[ORDER_NUMBER] has shipped! 📦"

**Content**:
- Shipping confirmation
- Tracking information (if available)
- Delivery timeline
- Package care instructions

## Error Handling

### Graceful Degradation
- **Non-blocking**: Email failures don't break core functionality
- **Logging**: All email attempts are logged for monitoring
- **Retry Logic**: Could be added for failed email attempts
- **Fallback**: System continues working even if emails fail

### Error Scenarios
1. **Missing API Key** - Returns error, doesn't crash
2. **Resend API Errors** - Logged and handled gracefully
3. **Invalid Email Addresses** - Validation prevents sending
4. **Network Issues** - Timeout handling and error logging

## Testing

### Unit Tests (`/tests/unit/email.test.ts`)
- Email service function testing
- Template rendering validation
- Error handling verification
- Mock Resend API responses

### Integration Tests (`/tests/integration/email-integration.test.ts`)
- End-to-end email flow testing
- API endpoint integration
- Error handling in real scenarios
- Email trigger validation

### Test Coverage
- ✅ All email functions tested
- ✅ Error scenarios covered
- ✅ Integration points validated
- ✅ Template content verification

## Monitoring and Analytics

### Logging
- **Success Logs**: Email sent confirmations with message IDs
- **Error Logs**: Failed attempts with error details
- **Performance Logs**: Email sending duration

### Resend Dashboard
- **Delivery Rates** - Monitor email deliverability
- **Bounce Rates** - Track invalid email addresses
- **Open Rates** - Customer engagement metrics
- **Click Rates** - CTA effectiveness

## Security and Compliance

### Data Protection
- **No Sensitive Data** - Emails don't contain payment info
- **Secure Links** - Artwork URLs use secure tokens
- **Privacy Compliant** - GDPR/CCPA considerations

### Email Security
- **SPF/DKIM** - Domain authentication configured
- **Unsubscribe** - Not implemented (transactional emails)
- **Rate Limiting** - Resend handles sending limits

## Performance Considerations

### Optimization
- **Async Processing** - Emails sent asynchronously
- **Non-blocking** - Core functionality not affected by email delays
- **Efficient Templates** - Minimal HTML for fast rendering
- **Image Optimization** - Artwork previews properly sized

### Scalability
- **Resend Limits** - 100 emails/day on free tier, upgrade for production
- **Queue System** - Could add Redis queue for high volume
- **Batch Processing** - Future enhancement for bulk emails

## Deployment Checklist

### Pre-deployment
- [ ] Resend account created and verified
- [ ] Domain DNS records configured
- [ ] API key added to environment variables
- [ ] Test emails sent successfully
- [ ] All tests passing

### Post-deployment
- [ ] Monitor email delivery rates
- [ ] Check error logs for issues
- [ ] Verify customer email reception
- [ ] Test all email triggers in production

## Future Enhancements

### Potential Improvements
1. **Email Templates** - Visual template builder
2. **Personalization** - More dynamic content
3. **A/B Testing** - Email subject line testing
4. **Analytics** - Enhanced tracking and metrics
5. **Automation** - Follow-up email sequences
6. **Localization** - Multi-language support

### Advanced Features
- **Email Preferences** - Customer notification settings
- **Delivery Optimization** - Send time optimization
- **Rich Content** - Interactive email elements
- **Integration** - CRM system integration

## Troubleshooting

### Common Issues

**Email not sending**
- Check RESEND_API_KEY environment variable
- Verify domain verification in Resend dashboard
- Check API rate limits

**Emails going to spam**
- Verify SPF/DKIM records
- Check sender reputation
- Review email content for spam triggers

**Template rendering issues**
- Validate HTML structure
- Test across email clients
- Check image URLs and accessibility

### Debug Steps
1. Check application logs for email errors
2. Verify Resend dashboard for delivery status
3. Test email functions in development
4. Validate environment configuration

## Contact and Support

For email system issues:
- **Technical Issues**: Check logs and Resend dashboard
- **Template Updates**: Modify `/src/lib/email.ts`
- **Configuration**: Update environment variables
- **Monitoring**: Use Resend analytics dashboard

---

*This documentation covers the complete email integration implementation for PawPop. The system is production-ready and provides comprehensive customer communication throughout the artwork creation and ordering process.*

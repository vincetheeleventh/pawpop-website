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

#### Development (.env.local)
```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxx

# Optional (defaults to pawpopart.com)
NEXT_PUBLIC_BASE_URL=https://pawpopart.com

# Email Testing Configuration
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=pawpopart@gmail.com
EMAIL_MOCK_MODE=false
EMAIL_LOG_MODE=true
```

#### Production (.env.production)
```bash
# Production Email Configuration
RESEND_API_KEY=your_production_resend_api_key
NEXT_PUBLIC_BASE_URL=https://pawpopart.com
EMAIL_TEST_MODE=false
EMAIL_MOCK_MODE=false
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
- **SPF/DKIM Records**: Must be configured for authentication
- **DMARC Policy**: Recommended for enhanced security

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

## Testing and Domain Protection

### 🛡️ Domain Reputation Protection

**Why It Matters:**
- **Deliverability**: Poor domain reputation leads to emails landing in spam folders
- **Blacklisting**: Sending too many test emails can get your domain blacklisted
- **Customer Trust**: Production emails from blacklisted domains damage brand credibility
- **Cost**: Email service providers may suspend accounts with poor reputation

### 🧪 Testing Modes

#### 1. Mock Mode (Safest)
```bash
node scripts/safe-email-test.js --mode=mock
```
- **No real emails sent** - Complete protection
- All emails logged to console only
- Perfect for development and debugging
- Zero impact on domain reputation

#### 2. Test Mode (Safe)
```bash
node scripts/safe-email-test.js --mode=test
```
- All emails redirected to single test recipient
- Rate limited (10 emails/hour per recipient)
- Clear test indicators in subject and content
- Minimal domain reputation impact

#### 3. Live Mode (Production Only)
```bash
node scripts/safe-email-test.js --mode=live
```
- Emails sent to actual recipients
- Only allowed in production environment
- Full domain reputation impact

### 🚦 Rate Limiting

The system includes built-in rate limiting to prevent spam:
- **Limit**: 10 emails per hour per recipient
- **Automatic**: Enforced in test mode
- **Logging**: Warns when limits are approached
- **Reset**: Hourly automatic reset

### Automatic Test Mode Detection
```typescript
// Automatically detects development environment
const isTestMode = process.env.NODE_ENV === 'development' || process.env.EMAIL_TEST_MODE === 'true'
```

### Test Email Wrapping
In test mode, all emails include:
- Clear test indicators
- Original recipient information
- Environment details
- Timestamp for tracking

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
- ✅ Domain protection mechanisms
- ✅ Rate limiting functionality

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
- **DMARC** - Domain-based Message Authentication, Reporting & Conformance
- **Unsubscribe** - Not implemented (transactional emails)
- **Rate Limiting** - Both Resend and application-level limits
- **Domain Reputation** - Protected through testing modes and rate limiting

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
- **Enhanced Rate Limiting** - Redis-based distributed rate limiting
- **Domain Reputation Monitoring** - Automated reputation tracking
- **Advanced Testing Modes** - Staging environment email routing

## Troubleshooting

### Common Issues

**Email not sending**
- Check RESEND_API_KEY environment variable
- Verify domain verification in Resend dashboard
- Check API rate limits
- Ensure test mode is properly configured

**Emails going to spam**
- Verify SPF/DKIM records
- Check sender reputation
- Review email content for spam triggers
- Monitor bounce rates and spam complaints

**Template rendering issues**
- Validate HTML structure
- Test across email clients
- Check image URLs and accessibility

**Rate limiting issues**
- Check remaining email quota with `EmailRateLimit.getRemainingEmails()`
- Switch to mock mode for development
- Monitor hourly reset cycles

### 🚨 Emergency Procedures

**If Domain Gets Blacklisted:**
1. **Stop all email sending** immediately
2. **Contact Resend support** for assistance
3. **Review sending patterns** for issues
4. **Implement stricter rate limiting**
5. **Consider using subdomain** for testing

**If Emails Go to Spam:**
1. **Check domain authentication** (SPF, DKIM, DMARC)
2. **Review email content** for spam triggers
3. **Monitor sender reputation** tools
4. **Reduce sending frequency** temporarily

### 📋 Best Practices

**Development:**
1. **Always use mock mode** for initial development
2. **Use test mode sparingly** for integration testing
3. **Never use live mode** in development
4. **Monitor rate limits** to avoid hitting caps

**Testing:**
1. **Use dedicated test email addresses**
2. **Clear test indicators** in all test emails
3. **Limit test frequency** to protect reputation
4. **Document test scenarios** for team members

**Production:**
1. **Verify domain ownership** in Resend dashboard
2. **Set up SPF/DKIM records** for authentication
3. **Monitor bounce rates** and spam complaints
4. **Use proper unsubscribe mechanisms**

### Debug Steps
1. Check application logs for email errors
2. Verify Resend dashboard for delivery status
3. Test email functions in development
4. Validate environment configuration
5. Monitor rate limiting status
6. Check domain reputation tools

## Contact and Support

For email system issues:
- **Technical Issues**: Check logs and Resend dashboard
- **Template Updates**: Modify `/src/lib/email.ts`
- **Configuration**: Update environment variables
- **Monitoring**: Use Resend analytics dashboard
- **Domain Issues**: Check Resend dashboard for domain status
- **Resend Support**: [support@resend.com](mailto:support@resend.com)

### 🔗 Useful Resources

- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [Email Authentication Guide](https://resend.com/docs/dashboard/domains/authentication)
- [Sender Reputation Tools](https://www.mail-tester.com/)
- [Email Deliverability Best Practices](https://resend.com/docs/knowledge-base/deliverability)

---

*This documentation covers the complete email integration implementation for PawPop. The system is production-ready and provides comprehensive customer communication throughout the artwork creation and ordering process.*

# Email Domain Reputation Protection Guide

This guide outlines best practices and tools for protecting your email domain reputation during development and testing of the PawPop email system.

## 🛡️ Domain Reputation Protection

### Why It Matters
- **Deliverability**: Poor domain reputation leads to emails landing in spam folders
- **Blacklisting**: Sending too many test emails can get your domain blacklisted
- **Customer Trust**: Production emails from blacklisted domains damage brand credibility
- **Cost**: Email service providers may suspend accounts with poor reputation

## 🧪 Testing Modes

### 1. Mock Mode (Safest)
```bash
node scripts/safe-email-test.js --mode=mock
```
- **No real emails sent** - Complete protection
- All emails logged to console only
- Perfect for development and debugging
- Zero impact on domain reputation

### 2. Test Mode (Safe)
```bash
node scripts/safe-email-test.js --mode=test
```
- All emails redirected to single test recipient
- Rate limited (10 emails/hour per recipient)
- Clear test indicators in subject and content
- Minimal domain reputation impact

### 3. Live Mode (Production Only)
```bash
node scripts/safe-email-test.js --mode=live
```
- Emails sent to actual recipients
- Only allowed in production environment
- Full domain reputation impact

## 🔧 Environment Configuration

### Development (.env.local)
```env
# Email Testing Configuration
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=pawpopart@gmail.com
EMAIL_MOCK_MODE=false
EMAIL_LOG_MODE=true

# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
```

### Production (.env.production)
```env
# Production Email Configuration
EMAIL_TEST_MODE=false
EMAIL_MOCK_MODE=false
RESEND_API_KEY=your_production_resend_api_key
```

## 🚦 Rate Limiting

The system includes built-in rate limiting to prevent spam:

- **Limit**: 10 emails per hour per recipient
- **Automatic**: Enforced in test mode
- **Logging**: Warns when limits are approached
- **Reset**: Hourly automatic reset

## 📧 Email Service Features

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

### Mock Email Service
```typescript
import { MockEmailService } from '@/lib/email-testing'

// Log emails without sending
await MockEmailService.send({
  to: 'customer@example.com',
  subject: 'Test Email',
  html: '<p>Test content</p>'
})

// View logged emails
const emails = MockEmailService.getEmails()
```

## 🔍 Monitoring and Debugging

### Email Logs
All email operations are logged with:
- Success/failure status
- Recipient information (masked in production)
- Message IDs for tracking
- Error details when applicable

### Rate Limit Monitoring
```typescript
import { EmailRateLimit } from '@/lib/email-testing'

// Check remaining emails
const remaining = EmailRateLimit.getRemainingEmails('test@example.com')
console.log(`Remaining emails: ${remaining}`)
```

## 📋 Best Practices

### Development
1. **Always use mock mode** for initial development
2. **Use test mode sparingly** for integration testing
3. **Never use live mode** in development
4. **Monitor rate limits** to avoid hitting caps

### Testing
1. **Use dedicated test email addresses**
2. **Clear test indicators** in all test emails
3. **Limit test frequency** to protect reputation
4. **Document test scenarios** for team members

### Production
1. **Verify domain ownership** in Resend dashboard
2. **Set up SPF/DKIM records** for authentication
3. **Monitor bounce rates** and spam complaints
4. **Use proper unsubscribe mechanisms**

## 🚨 Emergency Procedures

### If Domain Gets Blacklisted
1. **Stop all email sending** immediately
2. **Contact Resend support** for assistance
3. **Review sending patterns** for issues
4. **Implement stricter rate limiting**
5. **Consider using subdomain** for testing

### If Emails Go to Spam
1. **Check domain authentication** (SPF, DKIM, DMARC)
2. **Review email content** for spam triggers
3. **Monitor sender reputation** tools
4. **Reduce sending frequency** temporarily

## 🔗 Useful Resources

- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [Email Authentication Guide](https://resend.com/docs/dashboard/domains/authentication)
- [Sender Reputation Tools](https://www.mail-tester.com/)
- [Email Deliverability Best Practices](https://resend.com/docs/knowledge-base/deliverability)

## 📞 Support

For email delivery issues:
- **Resend Support**: [support@resend.com](mailto:support@resend.com)
- **Domain Issues**: Check Resend dashboard for domain status
- **Development Questions**: Review this documentation and test logs

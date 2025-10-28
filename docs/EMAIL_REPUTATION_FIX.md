# Email Reputation Fix Guide for PawPop

## Current Issue
Gmail is showing "Images in this message are hidden. This message appears suspicious" warning for emails from `updates.pawpopart.com`.

## Root Causes
1. **New domain** (only 29 days old) with limited sending history
2. **Recent bounces** to non-existent test domains
3. **Weak DMARC policy** (`p=none` instead of `p=quarantine`)
4. **Spam-triggering content** (emojis in subject lines, promotional language)
5. **Low engagement** (no established pattern of users opening emails)

---

## Immediate Fixes (Do Today)

### 1. Update DMARC Policy to Quarantine

**Current:** `v=DMARC1; p=none;`

**Update to:**
```
Type: TXT
Hostname: _dmarc.updates
Value: v=DMARC1; p=quarantine; rua=mailto:pawpopart@gmail.com; pct=100; adkim=s; aspf=s;
```

**Where to add:**
- Log into your DNS provider (where you manage pawpopart.com)
- Add the TXT record above
- Wait 24-48 hours for propagation

**Why this helps:**
- Shows email providers you're serious about authentication
- Prevents spoofing and improves deliverability
- Required for BIMI (brand indicators) in the future

### 2. Improve Email Subject Lines

**Changed:**
- ❌ `Your masterpiece is being created! 🎨` (spammy)
- ✅ `Your PawPop Masterpiece - Creating Now` (professional)

- ❌ `Your masterpiece is ready! 🎉` (spammy)
- ✅ `Your PawPop Masterpiece is Ready` (professional)

**Why this helps:**
- Gmail flags excessive emojis and exclamation marks as promotional
- Professional subject lines improve inbox placement
- Consistent branding builds trust

### 3. Stop Sending to Invalid Addresses

**Never send to:**
- `test-deferred@example.com`
- `test@example.com`
- Any non-existent domains

**Use instead:**
- Your own email addresses for testing
- Resend's test mode (set `EMAIL_TEST_MODE=true`)
- Real customer emails only in production

---

## Short-term Improvements (This Week)

### 4. Add Plain Text Version to Emails

Update `sendEmail()` function to include plain text:

```typescript
export async function sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // ... existing code ...
  
  const emailPayload = {
    from: data.from || 'PawPop <hello@updates.pawpopart.com>',
    replyTo: data.replyTo || 'hello@pawpopart.com',
    to: isTestMode ? testEmailRecipient : data.to,
    subject: isTestMode ? `[TEST] ${data.subject}` : data.subject,
    html: data.html,
    text: stripHtml(data.html) // Add plain text version
  }
  
  const { data: result, error } = await resend.emails.send(emailPayload)
  // ... rest of code
}
```

### 5. Warm Up Your Domain Properly

**Week 1:** Send 10-20 emails/day to engaged users
**Week 2:** Send 50-100 emails/day
**Week 3:** Send 200-500 emails/day
**Week 4+:** Normal volume

**Best practices:**
- Send to users who have recently engaged with your site
- Monitor open rates and bounce rates daily
- Pause if bounce rate exceeds 5%

### 6. Improve Email Content

**Remove spam triggers:**
- ❌ "FREE" in all caps
- ❌ Multiple exclamation marks!!!
- ❌ "Click here now!"
- ❌ All caps words: AMAZING, INCREDIBLE
- ❌ Excessive emojis

**Add trust signals:**
- ✅ Real physical address (already have: 2006-1323 Homer St, Vancouver)
- ✅ Unsubscribe link (add this!)
- ✅ Real reply-to address (already have: hello@updates.pawpopart.com)
- ✅ Consistent sender name and email

### 7. Add Unsubscribe Link

Add to all email footers:

```html
<div class="footer">
  <p>PawPop - The Unforgettable Gift for Pet Moms</p>
  <p>2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
  <p>Questions? Reply to this email or contact us at hello@updates.pawpopart.com</p>
  <p style="font-size: 12px; color: #666;">
    <a href="{{unsubscribe_url}}" style="color: #666; text-decoration: underline;">Unsubscribe</a> | 
    <a href="https://pawpopart.com/privacy" style="color: #666; text-decoration: underline;">Privacy Policy</a>
  </p>
</div>
```

---

## Long-term Strategy (This Month)

### 8. Monitor Email Metrics

**Track in Resend dashboard:**
- Open rate (target: >20%)
- Click rate (target: >2%)
- Bounce rate (keep <2%)
- Spam complaint rate (keep <0.1%)

**Set up alerts:**
- Alert if bounce rate >5%
- Alert if spam complaints >0.5%
- Daily summary of email performance

### 9. Implement Engagement-Based Sending

**Segment your list:**
- **Engaged users** (opened email in last 30 days) - send all emails
- **Inactive users** (no opens in 30-90 days) - send less frequently
- **Dead addresses** (no opens in 90+ days) - stop sending

### 10. Set Up DMARC Monitoring

**Use your DMARC reports:**
```
rua=mailto:pawpopart@gmail.com
```

**What to monitor:**
- SPF/DKIM alignment rates (target: 100%)
- Failed authentication attempts (investigate any)
- Unauthorized senders (block immediately)

**Tools to use:**
- [DMARC Analyzer](https://www.dmarcanalyzer.com/) (free tier)
- [Postmark DMARC](https://dmarc.postmarkapp.com/) (free)

---

## Testing Your Improvements

### Immediate Tests (After DNS Changes)

**1. Check DNS propagation:**
```bash
dig TXT _dmarc.updates.pawpopart.com
```

**2. Test email authentication:**
- Send test email to your Gmail
- View email source (Show original)
- Check for:
  - `SPF: PASS`
  - `DKIM: PASS`
  - `DMARC: PASS`

**3. Use email testing tools:**
- [Mail Tester](https://www.mail-tester.com/) - Get spam score
- [GlockApps](https://glockapps.com/) - Inbox placement test
- [Litmus](https://www.litmus.com/) - Email preview across clients

### Weekly Monitoring

**Check Resend dashboard:**
- Delivery rate (target: >98%)
- Open rate trend (should increase over time)
- Bounce rate (should decrease over time)

**Gmail test:**
- Send test email to fresh Gmail account
- Check if images are blocked
- Check spam folder placement

---

## Expected Timeline

### Week 1 (Now):
- ✅ Update DMARC policy
- ✅ Fix subject lines (done)
- ✅ Stop sending to invalid addresses
- ⏳ Add plain text versions
- ⏳ Add unsubscribe links

### Week 2:
- Images should start showing for some users
- Spam score should improve to 7-8/10
- Bounce rate should drop below 5%

### Week 3-4:
- Images showing for most users
- Spam score 8-9/10
- Gmail trust improving

### Month 2:
- Full reputation recovery
- Images showing by default
- No suspicious warnings
- Inbox placement >95%

---

## Emergency Actions (If Things Get Worse)

### If bounce rate exceeds 10%:
1. **Stop all sending immediately**
2. Clean your email list
3. Verify all email addresses
4. Resume with engaged users only

### If spam complaints exceed 0.5%:
1. **Review email content** for spam triggers
2. Add prominent unsubscribe link
3. Segment list to engaged users only
4. Consider re-permission campaign

### If domain gets blacklisted:
1. Check blacklist status: [MXToolbox](https://mxtoolbox.com/blacklists.aspx)
2. Request delisting from each blacklist
3. Fix root cause before resuming
4. Consider using subdomain for transactional emails

---

## Monitoring Checklist

### Daily:
- [ ] Check Resend dashboard for bounces
- [ ] Monitor spam complaint rate
- [ ] Review any delivery failures

### Weekly:
- [ ] Test email to Gmail/Outlook/Yahoo
- [ ] Check spam score on Mail Tester
- [ ] Review engagement metrics

### Monthly:
- [ ] Review DMARC reports
- [ ] Clean email list (remove bounces)
- [ ] Update email content based on performance

---

## Current Status

**DNS Configuration:**
- ✅ SPF: Verified for `send.updates.pawpopart.com`
- ✅ DKIM: Verified
- ⚠️ DMARC: `p=none` (needs update to `p=quarantine`)

**Email Content:**
- ✅ Subject lines: Fixed (no more emojis)
- ⚠️ Plain text: Missing (needs implementation)
- ⚠️ Unsubscribe: Missing (needs implementation)
- ✅ Physical address: Present
- ✅ Reply-to: Configured

**Sending Practices:**
- ⚠️ Recent bounces to invalid addresses (stop immediately)
- ⚠️ Low engagement history (need warm-up)
- ✅ Proper from address
- ✅ Real business domain

---

## Quick Win Summary

**Do these 3 things TODAY:**
1. ✅ Update DMARC to `p=quarantine` in DNS
2. ✅ Stop sending to test/invalid addresses
3. ⏳ Deploy updated subject lines (already coded)

**Expected improvement:** Within 7 days, Gmail should start showing images for most users.

**Full recovery:** 30 days of good sending behavior will restore full reputation.

---

## Support Resources

**Resend Documentation:**
- [Email Best Practices](https://resend.com/docs/knowledge-base/email-best-practices)
- [DMARC Setup](https://resend.com/docs/dashboard/domains/dmarc)

**Email Testing Tools:**
- [Mail Tester](https://www.mail-tester.com/) - Free spam score
- [MXToolbox](https://mxtoolbox.com/) - DNS and blacklist checks
- [Google Postmaster Tools](https://postmaster.google.com/) - Gmail reputation

**Questions?**
Contact Resend support or check their documentation for specific issues.

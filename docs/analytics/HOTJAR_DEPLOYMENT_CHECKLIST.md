# Hotjar Analytics - Production Deployment Checklist

## Pre-Deployment

### 1. Hotjar Account Setup
- [ ] Sign up for Hotjar account at [hotjar.com](https://www.hotjar.com)
- [ ] Create new site in Hotjar dashboard
- [ ] Note your Hotjar Site ID (numeric value, e.g., 1234567)
- [ ] Verify site ownership (Hotjar will guide you through this)

### 2. Environment Configuration
- [ ] Add to `.env.local` (development):
  ```env
  NEXT_PUBLIC_HOTJAR_ID=your_hotjar_site_id
  NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION=6
  ```
- [ ] Add to Vercel environment variables (production):
  ```bash
  vercel env add NEXT_PUBLIC_HOTJAR_ID production
  # Enter your Hotjar site ID when prompted
  ```

### 3. Privacy & Compliance
- [ ] Review privacy policy - add mention of Hotjar if required by jurisdiction
- [ ] Configure IP anonymization in Hotjar dashboard (Settings → Privacy)
- [ ] Enable "Do Not Track" support if required
- [ ] Review GDPR compliance requirements for your region
- [ ] Consider implementing consent management if required

### 4. Hotjar Dashboard Configuration

**Session Recordings:**
- [ ] Set recording limit (free tier: 35 sessions/day)
- [ ] Configure recording filters:
  - [ ] High-value users (orderValue > $100)
  - [ ] Error encounters
  - [ ] Specific page visits
- [ ] Set up data retention (default: 365 days)

**Heatmaps:**
- [ ] Configure heatmaps for key pages:
  - [ ] Landing page (/)
  - [ ] Artwork page (/artwork/[token])
  - [ ] Upload modal
  - [ ] Purchase modal
- [ ] Set minimum pageview threshold (recommended: 100)

**Conversion Funnels:**
- [ ] Create main conversion funnel:
  1. Landing page viewed
  2. Upload modal opened
  3. Form submitted
  4. Artwork page viewed
  5. Purchase modal opened
  6. Checkout started

**Feedback & Surveys:**
- [ ] Create post-generation satisfaction survey
- [ ] Create post-purchase NPS survey
- [ ] Configure survey triggers (optional)

### 5. Testing

**Local Testing:**
- [ ] Run build: `npm run build`
- [ ] Run tests: `npm run test:hotjar`
- [ ] Start dev server: `npm run dev`
- [ ] Verify Hotjar loads in browser console
- [ ] Check for `window.hj` function availability
- [ ] Perform test actions and verify events in Hotjar dashboard (1-2 min delay)

**Production Testing:**
- [ ] Deploy to staging/preview environment
- [ ] Visit site and perform key actions
- [ ] Check Hotjar dashboard for recorded events
- [ ] Verify session recordings work
- [ ] Test on mobile device
- [ ] Verify heatmaps are collecting data

## Deployment

### 6. Deploy to Production
- [ ] Merge Hotjar integration branch to main
- [ ] Deploy to Vercel production
- [ ] Verify environment variables are set
- [ ] Check build logs for errors
- [ ] Confirm deployment successful

### 7. Post-Deployment Verification

**Immediate Checks (0-5 minutes):**
- [ ] Visit production site
- [ ] Open browser console - verify no Hotjar errors
- [ ] Check `window.hj` is defined
- [ ] Perform test conversion flow
- [ ] Wait 1-2 minutes for data sync

**Dashboard Verification (5-15 minutes):**
- [ ] Log into Hotjar dashboard
- [ ] Check "Live" section for active visitors
- [ ] Verify events are being tracked
- [ ] Check session recordings are capturing
- [ ] Verify heatmaps are collecting data

**Functional Testing:**
- [ ] Test landing page tracking
- [ ] Test upload flow tracking
- [ ] Test artwork page tracking
- [ ] Test purchase flow tracking
- [ ] Test error tracking

## Post-Deployment

### 8. Monitoring & Optimization

**Week 1:**
- [ ] Monitor daily session count (free tier: 35/day limit)
- [ ] Review session recordings for UX issues
- [ ] Analyze heatmaps for unexpected behavior
- [ ] Check conversion funnel drop-off points
- [ ] Review console errors in recordings

**Week 2-4:**
- [ ] Identify top 3 UX friction points
- [ ] Create action plan for improvements
- [ ] Set up automated reports (if available)
- [ ] Tag important sessions for team review
- [ ] Compare Hotjar insights with Plausible/Google Ads data

**Monthly:**
- [ ] Review overall conversion rates
- [ ] Analyze session recording insights
- [ ] Optimize based on heatmap data
- [ ] Update funnels based on learnings
- [ ] Review and update surveys

### 9. Team Training
- [ ] Train team on accessing Hotjar dashboard
- [ ] Share how to filter sessions
- [ ] Explain event tracking schema
- [ ] Document common insights to look for
- [ ] Set up regular review meetings

### 10. Documentation Updates
- [ ] Update README with Hotjar setup instructions
- [ ] Document key insights from first month
- [ ] Create runbook for common issues
- [ ] Share success metrics with team

## Troubleshooting

### Common Issues

**Hotjar Not Loading:**
```bash
# Check environment variable
echo $NEXT_PUBLIC_HOTJAR_ID

# Verify in browser console
console.log(window.hj); // Should be a function
```

**Events Not Tracking:**
- Wait 1-2 minutes for data sync
- Check browser console for errors
- Verify event names match Hotjar dashboard
- Check ad blockers aren't blocking Hotjar

**Session Recordings Not Capturing:**
- Verify daily limit not reached (free tier: 35/day)
- Check recording filters aren't too restrictive
- Verify user hasn't enabled Do Not Track
- Check data retention settings

**Heatmaps Not Showing:**
- Verify minimum pageview threshold met
- Wait for sufficient data collection (recommended: 100+ views)
- Check heatmap is configured for correct URL
- Verify page hasn't changed significantly since creation

## Rollback Plan

If issues arise:

1. **Disable Hotjar tracking:**
   ```bash
   # Remove from Vercel
   vercel env rm NEXT_PUBLIC_HOTJAR_ID production
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Verify:**
   - Check Hotjar script no longer loads
   - Verify site functionality unaffected
   - Monitor error rates

## Success Criteria

### Week 1
- ✅ Hotjar script loading successfully
- ✅ Events tracking correctly
- ✅ Session recordings capturing user flows
- ✅ No performance degradation
- ✅ No privacy complaints

### Month 1
- ✅ Identified 3+ UX improvements from recordings
- ✅ Analyzed heatmaps for all key pages
- ✅ Conversion funnel insights documented
- ✅ Team trained on Hotjar usage
- ✅ Integration with existing analytics workflow

### Quarter 1
- ✅ Implemented UX improvements based on Hotjar insights
- ✅ Measurable improvement in conversion rates
- ✅ Regular team reviews of Hotjar data
- ✅ Established process for acting on insights
- ✅ ROI positive on Hotjar investment

## Analytics Stack Integration

### Hotjar + Plausible + Google Ads Workflow

**Weekly Review:**
1. **Plausible**: Overall traffic and conversion metrics
2. **Hotjar**: Why users drop off (recordings/heatmaps)
3. **Google Ads**: Campaign performance and ROI

**Example Insight Flow:**
1. Plausible shows 60% drop-off at artwork page
2. Hotjar recordings reveal users confused by CTA placement
3. Implement CTA redesign
4. Google Ads tracks improved conversion rate
5. Hotjar confirms users now engaging with CTA

## Support & Resources

- **Hotjar Documentation**: https://help.hotjar.com
- **Community Forum**: https://community.hotjar.com
- **Status Page**: https://status.hotjar.com
- **Integration Guide**: `/docs/analytics/HOTJAR_INTEGRATION.md`

## Sign-Off

- [ ] Development team lead approval
- [ ] Product manager approval
- [ ] Privacy officer approval (if applicable)
- [ ] Marketing team notified
- [ ] Documentation complete

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Hotjar Site ID**: _____________

**Notes**: _____________________________________________

# PawPop Monitoring System - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly set up and use the PawPop monitoring system.

## Prerequisites

- Node.js and npm installed
- Supabase project configured
- Environment variables set up in `.env.local`

## 1. Database Setup

First, apply the monitoring system migration:

```bash
npm run migration:apply 008_monitoring_system.sql
```

This creates the necessary database tables and functions:
- `monitoring_alerts` - Alert management
- `fal_ai_usage` - API usage tracking
- `stripe_webhook_events` - Webhook monitoring
- `system_health_metrics` - Service health data

## 2. Environment Configuration

Add these variables to your `.env.local`:

```bash
# Required for monitoring
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key

# Optional - Custom thresholds
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_FAL_DAILY_COST_LIMIT=50
MONITORING_STRIPE_SUCCESS_RATE_THRESHOLD=95
```

## 3. Test the System

Run the comprehensive test to verify everything is working:

```bash
npm run test:monitoring
```

Expected output:
```
✅ Health check completed for 3 services:
  🟢 supabase: healthy (923ms)
  🟢 fal-ai: healthy (977ms)
  🟢 stripe: healthy (767ms)

🚀 PawPop Monitoring System is ready for production!
```

## 4. Email Alerts

All monitoring alerts are automatically sent to **pawpopart@gmail.com** with:
- Color-coded severity indicators (🔥 Critical, 🚨 High, ⚠️ Medium, 💡 Low)
- Detailed alert information and actionable next steps
- Professional email formatting

## 5. Basic Usage

### Check System Health

```bash
curl https://your-domain.com/api/monitoring/health
```

### View Active Alerts

```bash
curl https://your-domain.com/api/monitoring/alerts
```

### Get Dashboard Data

```bash
curl https://your-domain.com/api/monitoring/dashboard
```

## 6. Understanding Alert Levels

- 🔥 **Critical**: Service down, immediate action required
- 🚨 **High**: High error rates, response within 1 hour
- ⚠️ **Medium**: Performance issues, response within 4 hours
- 💡 **Low**: Informational, review during business hours

## 7. Common Commands

```bash
# Run monitoring tests
npm run test:monitoring

# Check unit tests
npm run test tests/lib/monitoring-simple.test.ts

# View migration status
npm run migration:status

# Check database health
npm run migration:health
```

## 8. Troubleshooting

### High Connection Utilization
- Check for long-running queries
- Review connection pooling settings
- Consider scaling database resources

### fal.ai Rate Limits
- Implement request queuing
- Add retry logic with exponential backoff
- Consider upgrading API plan

### Email Delivery Issues
- Verify Resend API key
- Check domain verification status
- Review spam filters

## 9. Next Steps

1. **Monitor alerts**: All alerts are automatically sent to pawpopart@gmail.com
2. **Customize thresholds**: Adjust alert thresholds based on your usage patterns
3. **Monitor costs**: Review fal.ai usage and costs regularly
4. **Scale monitoring**: Add custom metrics for your specific needs

## 📚 Additional Resources

- [Complete Monitoring System Documentation](./MONITORING_SYSTEM.md)
- [Database Migration Guide](./database/MIGRATION_SETUP_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

## 🆘 Support

If you encounter issues:
1. Check the test output: `npm run test:monitoring`
2. Review logs in Supabase dashboard
3. Verify environment variables are set correctly
4. Contact the development team

---

**Last Updated**: December 22, 2024  
**Version**: 1.0.0  
**Status**: Production Ready
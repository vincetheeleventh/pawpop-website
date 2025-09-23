# PawPop Monitoring & Alerting System

## Overview

The PawPop monitoring system provides comprehensive real-time monitoring and alerting for all critical services including Supabase, fal.ai, Stripe, and system health. It includes automated alerts, performance tracking, and a centralized dashboard for operational visibility.

## Architecture

### Core Components

1. **Monitoring Service** (`/src/lib/monitoring.ts`)
   - Centralized monitoring logic
   - Health check implementations
   - Alert management
   - Threshold configuration

2. **Database Schema** (`/supabase/migrations/008_monitoring_system.sql`)
   - Monitoring alerts table
   - fal.ai usage tracking
   - Stripe webhook events
   - System health metrics

3. **API Endpoints**
   - `/api/monitoring/health` - Health check endpoint
   - `/api/monitoring/alerts` - Alert management
   - `/api/monitoring/dashboard` - Dashboard data

4. **Email Notifications** (`/src/lib/email.ts`)
   - System alert emails
   - Severity-based formatting
   - Professional templates

## Services Monitored

### 1. Supabase Database
- **Connection Pool Monitoring**
  - Active connections vs max connections
  - Connection utilization percentage
  - Alert threshold: >80% utilization
- **Query Performance**
  - Average query response time
  - Alert threshold: >5 seconds
- **Error Rate Tracking**
  - Database query failures
  - Alert threshold: >5% error rate

### 2. fal.ai API
- **Usage Tracking**
  - Daily and monthly request counts
  - Cost tracking per request
  - Response time monitoring
- **Rate Limit Monitoring**
  - Remaining API quota
  - Alert threshold: <10 requests remaining
- **Cost Alerts**
  - Daily cost limit: $50
  - Monthly cost limit: $1000
- **Error Rate**
  - API failure percentage
  - Alert threshold: >10% error rate

### 3. Stripe Webhooks
- **Webhook Success Rate**
  - Processing success/failure tracking
  - Alert threshold: <95% success rate
- **Processing Time**
  - Webhook processing duration
  - Performance monitoring
- **Failure Detection**
  - Consecutive failure alerts
  - Alert threshold: 3+ consecutive failures

### 4. System Health
- **Overall Status Calculation**
  - Healthy: All services operational
  - Warning: Some services degraded
  - Critical: Critical services down
- **Response Time Aggregation**
- **Uptime Calculation**

## Alert Severity Levels

### Critical 🔥
- Service completely down
- Monthly cost limits exceeded
- Payment processing failures
- **Action Required**: Immediate response

### High 🚨
- High error rates (>10%)
- Connection limits exceeded (>90%)
- Daily cost limits exceeded
- **Action Required**: Response within 1 hour

### Medium ⚠️
- Performance degradation
- Warning thresholds exceeded
- Moderate error rates (5-10%)
- **Action Required**: Response within 4 hours

### Low 💡
- Informational alerts
- Minor performance issues
- **Action Required**: Review during business hours

## Configuration

### Environment Variables

```bash
# Monitoring Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key

# Alert Thresholds (Optional - defaults provided)
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_SUPABASE_QUERY_TIME_THRESHOLD=5000
MONITORING_FAL_DAILY_COST_LIMIT=50
MONITORING_FAL_MONTHLY_COST_LIMIT=1000
MONITORING_STRIPE_SUCCESS_RATE_THRESHOLD=95
```

### Alert Thresholds

Thresholds are configurable in `/src/lib/monitoring.ts`:

```typescript
export const ALERT_THRESHOLDS = {
  supabase: {
    connectionUtilization: 80, // Alert when >80% of connections used
    avgQueryTime: 5000, // Alert when avg query time >5s
    errorRate: 5 // Alert when error rate >5%
  },
  falAi: {
    dailyCostLimit: 50, // Alert when daily cost >$50
    monthlyCostLimit: 1000, // Alert when monthly cost >$1000
    rateLimitThreshold: 10, // Alert when <10 requests remaining
    errorRate: 10 // Alert when error rate >10%
  },
  stripe: {
    webhookFailureThreshold: 3, // Alert after 3 consecutive failures
    webhookSuccessRate: 95, // Alert when success rate <95%
    paymentSuccessRate: 98 // Alert when payment success rate <98%
  }
};
```

## API Usage

### Health Check

```bash
# Get overall system health
GET /api/monitoring/health

# Trigger manual health check
POST /api/monitoring/health
{
  "service": "supabase" // Optional: check specific service
}
```

### Alert Management

```bash
# Get all active alerts
GET /api/monitoring/alerts

# Filter alerts
GET /api/monitoring/alerts?severity=critical&service=supabase

# Create manual alert
POST /api/monitoring/alerts
{
  "service": "system",
  "severity": "high",
  "message": "Manual alert for testing",
  "details": { "source": "manual" }
}

# Resolve alert
PATCH /api/monitoring/alerts
{
  "alertId": "alert_123",
  "action": "resolve"
}
```

### Dashboard Data

```bash
# Get comprehensive dashboard data
GET /api/monitoring/dashboard
```

## Database Schema

### Monitoring Tables

1. **monitoring_alerts**
   - `id` - Unique alert identifier
   - `service` - Service name (supabase, fal-ai, stripe, etc.)
   - `severity` - Alert severity level
   - `message` - Human-readable alert message
   - `details` - JSONB alert details
   - `timestamp` - Alert creation time
   - `resolved` - Resolution status

2. **fal_ai_usage**
   - `endpoint` - API endpoint used
   - `request_id` - Unique request identifier
   - `status` - Success/error status
   - `response_time` - Request duration
   - `cost` - API cost in USD
   - `error_message` - Error details if failed

3. **stripe_webhook_events**
   - `event_id` - Stripe event ID
   - `event_type` - Webhook event type
   - `status` - Processing status
   - `processing_time` - Processing duration
   - `error_message` - Error details if failed

4. **system_health_metrics**
   - `service` - Service name
   - `status` - Health status
   - `response_time` - Service response time
   - `error_rate` - Error percentage
   - `details` - JSONB service-specific metrics

### Database Functions

- `get_connection_stats()` - Supabase connection statistics
- `get_daily_fal_usage(date)` - Daily fal.ai usage summary
- `get_stripe_webhook_health(hours)` - Stripe webhook health summary
- `cleanup_monitoring_data()` - Data retention cleanup

## Integration Points

### Automatic Tracking

The monitoring system automatically tracks:

1. **Stripe Webhooks** - Enhanced `/src/app/api/webhook/route.ts`
2. **fal.ai API Calls** - Enhanced `/src/app/api/monalisa-maker/route.ts`
3. **Database Operations** - Automatic connection monitoring
4. **System Health** - Periodic health checks

### Manual Tracking

Use tracking functions for custom monitoring:

```typescript
import { trackFalAiUsage, trackStripeWebhook } from '@/lib/monitoring';

// Track fal.ai usage
await trackFalAiUsage({
  endpoint: 'pet-integration',
  requestId: 'req_123',
  status: 'success',
  responseTime: 2500,
  cost: 0.08
});

// Track Stripe webhook
await trackStripeWebhook({
  eventId: 'evt_123',
  eventType: 'checkout.session.completed',
  status: 'success',
  processingTime: 150
});
```

## Email Notifications

### Alert Email Template

System alerts are automatically sent via email with:
- Color-coded severity indicators
- Detailed alert information
- Actionable next steps
- Professional formatting

### Email Configuration

```typescript
// All monitoring alerts are sent to pawpopart@gmail.com
const recipient = 'pawpopart@gmail.com';

// Email format: [SEVERITY] service Alert: message
// Example: [HIGH] supabase Alert: High connection usage detected
```

## Deployment Setup

### 1. Database Migration

```bash
# Apply monitoring system migration
npm run migration:apply 008_monitoring_system.sql
```

### 2. Environment Configuration

Add monitoring environment variables to `.env.local`:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key

# Optional thresholds
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_FAL_DAILY_COST_LIMIT=50
```

### 3. Health Check Verification

```bash
# Test health check endpoint
curl https://pawpopart.com/api/monitoring/health

# Expected response
{
  "status": "healthy",
  "services": [...],
  "alerts": {...},
  "summary": {...}
}
```

### 4. Alert Testing

```bash
# Create test alert
curl -X POST https://pawpopart.com/api/monitoring/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "service": "system",
    "severity": "low",
    "message": "Test alert for monitoring system",
    "details": {"test": true}
  }'
```

## Monitoring Best Practices

### 1. Regular Health Checks
- Automated health checks every 5 minutes
- Manual health checks during deployments
- Service-specific monitoring during high traffic

### 2. Alert Management
- Acknowledge alerts promptly
- Document resolution steps
- Review alert thresholds monthly

### 3. Performance Optimization
- Monitor response times during peak usage
- Adjust connection limits based on usage patterns
- Optimize database queries based on monitoring data

### 4. Cost Management
- Daily fal.ai cost reviews
- Monthly cost trend analysis
- Alert threshold adjustments based on business needs

## Troubleshooting

### Common Issues

1. **High Connection Utilization**
   - Check for long-running queries
   - Review connection pooling settings
   - Consider scaling database resources

2. **fal.ai Rate Limits**
   - Implement request queuing
   - Add retry logic with exponential backoff
   - Consider upgrading API plan

3. **Stripe Webhook Failures**
   - Verify webhook endpoint accessibility
   - Check webhook signature validation
   - Review processing logic for errors

4. **Alert Email Delivery**
   - Verify Resend API key configuration
   - Check email recipient settings
   - Review spam filters and delivery logs

### Debug Commands

```bash
# Check monitoring system status
npm run monitoring:health

# View recent alerts
npm run monitoring:alerts

# Test email notifications
npm run monitoring:test-email
```

## Future Enhancements

### Planned Features

1. **Slack Integration**
   - Real-time alert notifications
   - Interactive alert management
   - Team collaboration features

2. **Advanced Analytics**
   - Trend analysis and forecasting
   - Performance benchmarking
   - Cost optimization recommendations

3. **Custom Dashboards**
   - Service-specific dashboards
   - Real-time metrics visualization
   - Historical data analysis

4. **Automated Remediation**
   - Auto-scaling based on metrics
   - Automatic retry mechanisms
   - Self-healing system responses

### Integration Roadmap

- [ ] PagerDuty integration for critical alerts
- [ ] Datadog/New Relic for advanced APM
- [ ] Grafana dashboards for visualization
- [ ] Automated load testing and monitoring
- [ ] Multi-region health monitoring

## Support

For monitoring system issues or questions:

1. **Check System Status**: `/api/monitoring/health`
2. **Review Recent Alerts**: `/api/monitoring/alerts`
3. **Contact Development Team**: dev-team@pawpopart.com
4. **Emergency Escalation**: alerts@pawpopart.com

---

**Last Updated**: December 22, 2024  
**Version**: 1.0.0  
**Status**: Production Ready

import { describe, it, expect } from 'vitest';

describe('Monitoring System Integration', () => {
  it('should have monitoring system available', async () => {
    // Test that the monitoring module can be imported
    const { monitoring, ALERT_THRESHOLDS } = await import('@/lib/monitoring');
    
    expect(monitoring).toBeDefined();
    expect(ALERT_THRESHOLDS).toBeDefined();
    expect(ALERT_THRESHOLDS.supabase.connectionUtilization).toBe(80);
    expect(ALERT_THRESHOLDS.falAi.dailyCostLimit).toBe(50);
    expect(ALERT_THRESHOLDS.stripe.webhookSuccessRate).toBe(95);
  });

  it('should have correct alert threshold values', async () => {
    const { ALERT_THRESHOLDS } = await import('@/lib/monitoring');
    
    // Supabase thresholds
    expect(ALERT_THRESHOLDS.supabase.connectionUtilization).toBe(80);
    expect(ALERT_THRESHOLDS.supabase.avgQueryTime).toBe(5000);
    expect(ALERT_THRESHOLDS.supabase.errorRate).toBe(5);

    // fal.ai thresholds
    expect(ALERT_THRESHOLDS.falAi.dailyCostLimit).toBe(50);
    expect(ALERT_THRESHOLDS.falAi.monthlyCostLimit).toBe(1000);
    expect(ALERT_THRESHOLDS.falAi.rateLimitThreshold).toBe(10);
    expect(ALERT_THRESHOLDS.falAi.errorRate).toBe(10);

    // Stripe thresholds
    expect(ALERT_THRESHOLDS.stripe.webhookFailureThreshold).toBe(3);
    expect(ALERT_THRESHOLDS.stripe.webhookSuccessRate).toBe(95);
    expect(ALERT_THRESHOLDS.stripe.paymentSuccessRate).toBe(98);
  });

  it('should have monitoring service with required methods', async () => {
    const { monitoring } = await import('@/lib/monitoring');
    
    expect(typeof monitoring.runHealthCheck).toBe('function');
    expect(typeof monitoring.checkSupabaseHealth).toBe('function');
    expect(typeof monitoring.checkFalAiHealth).toBe('function');
    expect(typeof monitoring.checkStripeHealth).toBe('function');
    expect(typeof monitoring.createAlert).toBe('function');
    expect(typeof monitoring.getActiveAlerts).toBe('function');
    expect(typeof monitoring.resolveAlert).toBe('function');
  });

  it('should have tracking functions available', async () => {
    const { trackFalAiUsage, trackStripeWebhook } = await import('@/lib/monitoring');
    
    expect(typeof trackFalAiUsage).toBe('function');
    expect(typeof trackStripeWebhook).toBe('function');
  });
});

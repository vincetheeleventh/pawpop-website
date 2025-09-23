import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [] as any[],
            error: null
          }))
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [] as any[],
            error: null
          }))
        })),
        limit: vi.fn(() => ({
          data: [] as any[],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}));

// Mock email function
vi.mock('@/lib/email', () => ({
  sendSystemAlertEmail: vi.fn().mockResolvedValue({ success: true })
}));

import { MonitoringService, trackFalAiUsage, trackStripeWebhook, ALERT_THRESHOLDS } from '@/lib/monitoring';

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkSupabaseHealth', () => {
    it('should return healthy status when connection stats are good', async () => {
      // Mock successful connection stats
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          active_connections: 10,
          max_connections: 100,
          active_queries: 2
        },
        error: null
      });

      // Mock successful test query
      mockSupabase.from().select().limit.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      const result = await monitoring.checkSupabaseHealth();

      expect(result.service).toBe('supabase');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details.connectionUtilization).toBe(10);
    });

    it('should return critical status when connection stats fail', async () => {
      // Mock failed connection stats
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' }
      });

      const result = await monitoring.checkSupabaseHealth();

      expect(result.service).toBe('supabase');
      expect(result.status).toBe('critical');
      expect(result.details.error).toBe('Connection failed');
    });

    it('should return warning status when connection utilization is high', async () => {
      // Mock high connection utilization
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          active_connections: 85,
          max_connections: 100,
          active_queries: 5
        },
        error: null
      });

      mockSupabase.from().select().limit.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      const result = await monitoring.checkSupabaseHealth();

      expect(result.service).toBe('supabase');
      expect(result.status).toBe('warning');
      expect(result.details.connectionUtilization).toBe(85);
    });

    it('should return critical status when connection utilization is very high', async () => {
      // Mock very high connection utilization
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          active_connections: 95,
          max_connections: 100,
          active_queries: 10
        },
        error: null
      });

      mockSupabase.from().select().limit.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      const result = await monitoring.checkSupabaseHealth();

      expect(result.service).toBe('supabase');
      expect(result.status).toBe('critical');
      expect(result.details.connectionUtilization).toBe(95);
    });
  });

  describe('checkFalAiHealth', () => {
    it('should return healthy status with normal usage', async () => {
      // Mock normal fal.ai usage
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { cost: 0.05, status: 'success' },
          { cost: 0.03, status: 'success' }
        ],
        error: null
      });

      const result = await monitoring.checkFalAiHealth();

      expect(result.service).toBe('fal-ai');
      expect(result.status).toBe('healthy');
      expect(result.details.requestsToday).toBe(2);
      expect(result.details.costToday).toBe(0.08);
    });

    it('should return warning status when daily cost limit is exceeded', async () => {
      // Mock high daily cost
      const highCostRecords = Array(20).fill(null).map(() => ({ cost: 3, status: 'success' }));
      
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: highCostRecords,
        error: null
      });

      const result = await monitoring.checkFalAiHealth();

      expect(result.service).toBe('fal-ai');
      expect(result.status).toBe('warning');
      expect(result.details.costToday).toBe(60); // 20 * 3
    });

    it('should return warning status when error rate is high', async () => {
      // Mock high error rate
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { cost: 0.05, status: 'success' },
          { cost: 0, status: 'error' },
          { cost: 0, status: 'error' },
          { cost: 0.05, status: 'success' }
        ],
        error: null
      });

      const result = await monitoring.checkFalAiHealth();

      expect(result.service).toBe('fal-ai');
      expect(result.status).toBe('warning');
      expect(result.details.errorRate).toBe(50); // 2 errors out of 4 requests
    });
  });

  describe('checkStripeHealth', () => {
    it('should return healthy status with good webhook performance', async () => {
      // Mock successful webhooks
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { status: 'success', created_at: new Date().toISOString() },
          { status: 'success', created_at: new Date().toISOString() }
        ],
        error: null
      });

      // Mock successful orders
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { status: 'completed' },
          { status: 'completed' }
        ],
        error: null
      });

      const result = await monitoring.checkStripeHealth();

      expect(result.service).toBe('stripe');
      expect(result.status).toBe('healthy');
      expect(result.details.webhookSuccessRate).toBe(100);
      expect(result.details.paymentSuccessRate).toBe(100);
    });

    it('should return warning status when webhook success rate is low', async () => {
      // Mock failed webhooks
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { status: 'success', created_at: new Date().toISOString() },
          { status: 'failed', created_at: new Date().toISOString() },
          { status: 'failed', created_at: new Date().toISOString() }
        ],
        error: null
      });

      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [{ status: 'completed' }],
        error: null
      });

      const result = await monitoring.checkStripeHealth();

      expect(result.service).toBe('stripe');
      expect(result.status).toBe('warning');
      expect(result.details.webhookSuccessRate).toBeCloseTo(33.33, 1);
    });

    it('should return critical status when payment success rate is low', async () => {
      // Mock successful webhooks but failed payments
      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [{ status: 'success', created_at: new Date().toISOString() }],
        error: null
      });

      mockSupabase.from().select().gte().order.mockResolvedValueOnce({
        data: [
          { status: 'completed' },
          { status: 'failed' },
          { status: 'failed' },
          { status: 'failed' }
        ],
        error: null
      });

      const result = await monitoring.checkStripeHealth();

      expect(result.service).toBe('stripe');
      expect(result.status).toBe('critical');
      expect(result.details.paymentSuccessRate).toBe(25);
    });
  });

  describe('createAlert', () => {
    it('should create and store alert successfully', async () => {
      const alertData = {
        service: 'supabase' as const,
        severity: 'high' as const,
        message: 'Test alert',
        details: { test: true }
      };

      await monitoring.createAlert(alertData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'supabase',
          severity: 'high',
          message: 'Test alert',
          details: { test: true },
          resolved: false
        })
      );
    });

    it('should handle alert creation errors gracefully', async () => {
      mockSupabase.from().insert.mockRejectedValueOnce(new Error('Database error'));

      const alertData = {
        service: 'system' as const,
        severity: 'low' as const,
        message: 'Test alert',
        details: {}
      };

      // Should not throw error
      await expect(monitoring.createAlert(alertData)).resolves.toBeUndefined();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          service: 'supabase',
          severity: 'high',
          message: 'High connection usage',
          resolved: false,
          timestamp: new Date().toISOString()
        }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockAlerts,
        error: null
      });

      const alerts = await monitoring.getActiveAlerts();

      expect(alerts).toEqual(mockAlerts);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('resolved', false);
    });

    it('should handle database errors when fetching alerts', async () => {
      mockSupabase.from().select().eq().order.mockRejectedValueOnce(new Error('Database error'));

      const alerts = await monitoring.getActiveAlerts();

      expect(alerts).toEqual([]);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      const alertId = 'alert_123';

      await monitoring.resolveAlert(alertId);

      expect(mockSupabase.from().update).toHaveBeenCalledWith({ resolved: true });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', alertId);
    });

    it('should handle resolve errors gracefully', async () => {
      mockSupabase.from().update().eq.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw error
      await expect(monitoring.resolveAlert('alert_123')).resolves.toBeUndefined();
    });
  });

  describe('runHealthCheck', () => {
    it('should run health checks for all services', async () => {
      // Mock successful responses for all services
      mockSupabase.rpc.mockResolvedValue({
        data: { active_connections: 10, max_connections: 100, active_queries: 1 },
        error: null
      });

      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ id: 1 }],
        error: null
      });

      mockSupabase.from().select().gte().order.mockResolvedValue({
        data: [{ cost: 0.05, status: 'success' }],
        error: null
      });

      const results = await monitoring.runHealthCheck();

      expect(results).toHaveLength(3); // supabase, fal-ai, stripe
      expect(results.every(r => r.status === 'healthy')).toBe(true);
    });

    it('should handle individual service failures', async () => {
      // Mock one service failure
      mockSupabase.rpc.mockRejectedValueOnce(new Error('Supabase error'));
      
      // Mock other services success
      mockSupabase.from().select().gte().order.mockResolvedValue({
        data: [],
        error: null
      });

      const results = await monitoring.runHealthCheck();

      expect(results).toHaveLength(3);
      expect(results.some(r => r.status === 'down')).toBe(true);
    });
  });
});

describe('Tracking Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackFalAiUsage', () => {
    it('should track successful fal.ai usage', async () => {
      const usageData = {
        endpoint: 'monalisa-maker',
        requestId: 'req_123',
        status: 'success' as const,
        responseTime: 2500,
        cost: 0.05
      };

      await trackFalAiUsage(usageData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        endpoint: 'monalisa-maker',
        request_id: 'req_123',
        status: 'success',
        response_time: 2500,
        cost: 0.05,
        error_message: undefined,
        created_at: expect.any(String)
      });
    });

    it('should track failed fal.ai usage', async () => {
      const usageData = {
        endpoint: 'pet-integration',
        requestId: 'req_456',
        status: 'error' as const,
        responseTime: 1000,
        errorMessage: 'API rate limit exceeded'
      };

      await trackFalAiUsage(usageData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        endpoint: 'pet-integration',
        request_id: 'req_456',
        status: 'error',
        response_time: 1000,
        cost: 0,
        error_message: 'API rate limit exceeded',
        created_at: expect.any(String)
      });
    });

    it('should handle tracking errors gracefully', async () => {
      mockSupabase.from().insert.mockRejectedValueOnce(new Error('Database error'));

      const usageData = {
        endpoint: 'test',
        requestId: 'req_789',
        status: 'success' as const,
        responseTime: 1000
      };

      // Should not throw error
      await expect(trackFalAiUsage(usageData)).resolves.toBeUndefined();
    });
  });

  describe('trackStripeWebhook', () => {
    it('should track successful webhook processing', async () => {
      const webhookData = {
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
        status: 'success' as const,
        processingTime: 150
      };

      await trackStripeWebhook(webhookData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        event_id: 'evt_123',
        event_type: 'checkout.session.completed',
        status: 'success',
        processing_time: 150,
        error_message: undefined,
        created_at: expect.any(String)
      });
    });

    it('should track failed webhook processing', async () => {
      const webhookData = {
        eventId: 'evt_456',
        eventType: 'payment_intent.payment_failed',
        status: 'failed' as const,
        processingTime: 500,
        errorMessage: 'Order processing failed'
      };

      await trackStripeWebhook(webhookData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        event_id: 'evt_456',
        event_type: 'payment_intent.payment_failed',
        status: 'failed',
        processing_time: 500,
        error_message: 'Order processing failed',
        created_at: expect.any(String)
      });
    });

    it('should handle tracking errors gracefully', async () => {
      mockSupabase.from().insert.mockRejectedValueOnce(new Error('Database error'));

      const webhookData = {
        eventId: 'evt_789',
        eventType: 'test.event',
        status: 'success' as const,
        processingTime: 100
      };

      // Should not throw error
      await expect(trackStripeWebhook(webhookData)).resolves.toBeUndefined();
    });
  });
});

describe('Alert Thresholds', () => {
  it('should have correct threshold values', () => {
    expect(ALERT_THRESHOLDS.supabase.connectionUtilization).toBe(80);
    expect(ALERT_THRESHOLDS.supabase.avgQueryTime).toBe(5000);
    expect(ALERT_THRESHOLDS.supabase.errorRate).toBe(5);

    expect(ALERT_THRESHOLDS.falAi.dailyCostLimit).toBe(50);
    expect(ALERT_THRESHOLDS.falAi.monthlyCostLimit).toBe(1000);
    expect(ALERT_THRESHOLDS.falAi.rateLimitThreshold).toBe(10);
    expect(ALERT_THRESHOLDS.falAi.errorRate).toBe(10);

    expect(ALERT_THRESHOLDS.stripe.webhookFailureThreshold).toBe(3);
    expect(ALERT_THRESHOLDS.stripe.webhookSuccessRate).toBe(95);
    expect(ALERT_THRESHOLDS.stripe.paymentSuccessRate).toBe(98);
  });
});

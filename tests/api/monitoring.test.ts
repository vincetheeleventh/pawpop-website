import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the monitoring service
const mockMonitoring = {
  runHealthCheck: vi.fn(),
  getActiveAlerts: vi.fn(),
  createAlert: vi.fn(),
  resolveAlert: vi.fn(),
  checkSupabaseHealth: vi.fn(),
  checkFalAiHealth: vi.fn(),
  checkStripeHealth: vi.fn()
};

vi.mock('@/lib/monitoring', () => ({
  monitoring: mockMonitoring
}));

describe('Monitoring API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('/api/monitoring/health', () => {
    it('should return health status for GET request', async () => {
      // Mock health check results
      const mockHealthResults = [
        {
          service: 'supabase',
          status: 'healthy',
          responseTime: 150,
          errorRate: 0,
          lastCheck: new Date().toISOString(),
          details: { connectionUtilization: 45 }
        },
        {
          service: 'fal-ai',
          status: 'healthy',
          responseTime: 2500,
          errorRate: 2,
          lastCheck: new Date().toISOString(),
          details: { requestsToday: 25, costToday: 1.25 }
        },
        {
          service: 'stripe',
          status: 'healthy',
          responseTime: 300,
          errorRate: 1,
          lastCheck: new Date().toISOString(),
          details: { webhookSuccessRate: 99.5, paymentSuccessRate: 99.8 }
        }
      ];

      const mockActiveAlerts = [
        {
          id: 'alert_1',
          service: 'system',
          severity: 'low',
          message: 'Test alert',
          timestamp: new Date().toISOString(),
          resolved: false
        }
      ];

      mockMonitoring.runHealthCheck.mockResolvedValue(mockHealthResults);
      mockMonitoring.getActiveAlerts.mockResolvedValue(mockActiveAlerts);

      // Import and test the GET handler
      const { GET } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services).toHaveLength(3);
      expect(data.alerts.total).toBe(1);
      expect(data.summary.totalServices).toBe(3);
      expect(data.summary.healthyServices).toBe(3);
      expect(data.summary.uptime).toBe('100.0');
    });

    it('should return warning status when some services are degraded', async () => {
      const mockHealthResults = [
        {
          service: 'supabase',
          status: 'healthy',
          responseTime: 150,
          errorRate: 0,
          lastCheck: new Date().toISOString(),
          details: {}
        },
        {
          service: 'fal-ai',
          status: 'warning',
          responseTime: 5000,
          errorRate: 8,
          lastCheck: new Date().toISOString(),
          details: { costToday: 45 }
        },
        {
          service: 'stripe',
          status: 'healthy',
          responseTime: 300,
          errorRate: 1,
          lastCheck: new Date().toISOString(),
          details: {}
        }
      ];

      mockMonitoring.runHealthCheck.mockResolvedValue(mockHealthResults);
      mockMonitoring.getActiveAlerts.mockResolvedValue([]);

      const { GET } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('warning');
      expect(data.summary.warningServices).toBe(1);
    });

    it('should return critical status when services are down', async () => {
      const mockHealthResults = [
        {
          service: 'supabase',
          status: 'critical',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date().toISOString(),
          details: { error: 'Connection failed' }
        },
        {
          service: 'fal-ai',
          status: 'healthy',
          responseTime: 2500,
          errorRate: 2,
          lastCheck: new Date().toISOString(),
          details: {}
        }
      ];

      mockMonitoring.runHealthCheck.mockResolvedValue(mockHealthResults);
      mockMonitoring.getActiveAlerts.mockResolvedValue([]);

      const { GET } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('critical');
      expect(data.summary.criticalServices).toBe(1);
    });

    it('should handle health check errors gracefully', async () => {
      mockMonitoring.runHealthCheck.mockRejectedValue(new Error('Health check failed'));
      mockMonitoring.getActiveAlerts.mockResolvedValue([]);

      const { GET } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Health check failed');
    });

    it('should trigger manual health check for POST request', async () => {
      mockMonitoring.checkSupabaseHealth.mockResolvedValue({
        service: 'supabase',
        status: 'healthy',
        responseTime: 150,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: {}
      });

      const { POST } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health', {
        method: 'POST',
        body: JSON.stringify({ service: 'supabase' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toBe('supabase');
      expect(data.status).toBe('healthy');
      expect(mockMonitoring.checkSupabaseHealth).toHaveBeenCalled();
    });

    it('should handle invalid service in POST request', async () => {
      const { POST } = await import('@/app/api/monitoring/health/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/health', {
        method: 'POST',
        body: JSON.stringify({ service: 'invalid-service' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid service specified');
    });
  });

  describe('/api/monitoring/alerts', () => {
    it('should return all active alerts for GET request', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          service: 'supabase',
          severity: 'high',
          message: 'High connection usage',
          timestamp: new Date().toISOString(),
          resolved: false,
          details: { connectionUtilization: 85 }
        },
        {
          id: 'alert_2',
          service: 'fal-ai',
          severity: 'medium',
          message: 'Daily cost limit approaching',
          timestamp: new Date().toISOString(),
          resolved: false,
          details: { costToday: 45 }
        }
      ];

      mockMonitoring.getActiveAlerts.mockResolvedValue(mockAlerts);

      const { GET } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.alerts).toHaveLength(2);
      expect(data.summary.total).toBe(2);
      expect(data.summary.high).toBe(1);
      expect(data.summary.medium).toBe(1);
    });

    it('should filter alerts by severity', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          service: 'supabase',
          severity: 'critical',
          message: 'Database down',
          timestamp: new Date().toISOString(),
          resolved: false,
          details: {}
        }
      ];

      mockMonitoring.getActiveAlerts.mockResolvedValue(mockAlerts);

      const { GET } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts?severity=critical');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].severity).toBe('critical');
    });

    it('should filter alerts by service', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          service: 'stripe',
          severity: 'high',
          message: 'Webhook failures',
          timestamp: new Date().toISOString(),
          resolved: false,
          details: {}
        }
      ];

      mockMonitoring.getActiveAlerts.mockResolvedValue(mockAlerts);

      const { GET } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts?service=stripe');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].service).toBe('stripe');
    });

    it('should create new alert for POST request', async () => {
      mockMonitoring.createAlert.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
        method: 'POST',
        body: JSON.stringify({
          service: 'system',
          severity: 'high',
          message: 'Manual test alert',
          details: { test: true }
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Alert created successfully');
      expect(mockMonitoring.createAlert).toHaveBeenCalledWith({
        service: 'system',
        severity: 'high',
        message: 'Manual test alert',
        details: { test: true }
      });
    });

    it('should validate required fields for POST request', async () => {
      const { POST } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
        method: 'POST',
        body: JSON.stringify({
          service: 'system'
          // Missing severity and message
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: service, severity, message');
    });

    it('should resolve alert for PATCH request', async () => {
      mockMonitoring.resolveAlert.mockResolvedValue(undefined);

      const { PATCH } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
        method: 'PATCH',
        body: JSON.stringify({
          alertId: 'alert_123',
          action: 'resolve'
        })
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Alert resolved successfully');
      expect(mockMonitoring.resolveAlert).toHaveBeenCalledWith('alert_123');
    });

    it('should validate PATCH request parameters', async () => {
      const { PATCH } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'resolve'
          // Missing alertId
        })
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: alertId, action');
    });

    it('should handle invalid action in PATCH request', async () => {
      const { PATCH } = await import('@/app/api/monitoring/alerts/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
        method: 'PATCH',
        body: JSON.stringify({
          alertId: 'alert_123',
          action: 'invalid-action'
        })
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action. Only "resolve" is supported');
    });
  });

  describe('/api/monitoring/dashboard', () => {
    it('should return comprehensive dashboard data', async () => {
      const mockHealthResults = [
        {
          service: 'supabase',
          status: 'healthy',
          responseTime: 150,
          errorRate: 0,
          lastCheck: new Date().toISOString(),
          details: { connectionUtilization: 45 }
        },
        {
          service: 'fal-ai',
          status: 'warning',
          responseTime: 2500,
          errorRate: 8,
          lastCheck: new Date().toISOString(),
          details: { requestsToday: 25, costToday: 45 }
        },
        {
          service: 'stripe',
          status: 'healthy',
          responseTime: 300,
          errorRate: 1,
          lastCheck: new Date().toISOString(),
          details: { webhookSuccessRate: 99.5 }
        }
      ];

      const mockActiveAlerts = [
        {
          id: 'alert_1',
          service: 'fal-ai',
          severity: 'medium',
          message: 'Daily cost limit approaching',
          timestamp: new Date().toISOString(),
          resolved: false,
          details: { costToday: 45 }
        }
      ];

      mockMonitoring.runHealthCheck.mockResolvedValue(mockHealthResults);
      mockMonitoring.getActiveAlerts.mockResolvedValue(mockActiveAlerts);

      const { GET } = await import('@/app/api/monitoring/dashboard/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('warning'); // Due to fal-ai warning
      expect(data.summary.totalServices).toBe(3);
      expect(data.summary.healthyServices).toBe(2);
      expect(data.summary.warningServices).toBe(1);
      expect(data.summary.criticalServices).toBe(0);
      expect(data.summary.uptime).toBe('100.0'); // Healthy + warning services
      expect(data.alerts.total).toBe(1);
      expect(data.alerts.medium).toBe(1);
      expect(data.alerts.byService['fal-ai']).toBe(1);
      expect(data.services.supabase.status).toBe('healthy');
      expect(data.services['fal-ai'].status).toBe('warning');
      expect(data.services.stripe.status).toBe('healthy');
    });

    it('should handle dashboard data fetch errors', async () => {
      mockMonitoring.runHealthCheck.mockRejectedValue(new Error('Dashboard error'));

      const { GET } = await import('@/app/api/monitoring/dashboard/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Dashboard error');
      expect(data.summary.totalServices).toBe(0);
    });

    it('should calculate correct metrics with mixed service statuses', async () => {
      const mockHealthResults = [
        { service: 'supabase', status: 'healthy', responseTime: 100, errorRate: 0, lastCheck: new Date().toISOString(), details: {} },
        { service: 'fal-ai', status: 'critical', responseTime: 0, errorRate: 100, lastCheck: new Date().toISOString(), details: {} },
        { service: 'stripe', status: 'warning', responseTime: 500, errorRate: 5, lastCheck: new Date().toISOString(), details: {} },
        { service: 'printify', status: 'down', responseTime: 0, errorRate: 100, lastCheck: new Date().toISOString(), details: {} }
      ];

      mockMonitoring.runHealthCheck.mockResolvedValue(mockHealthResults);
      mockMonitoring.getActiveAlerts.mockResolvedValue([]);

      const { GET } = await import('@/app/api/monitoring/dashboard/route');
      const request = new NextRequest('http://localhost:3000/api/monitoring/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('critical'); // Due to critical/down services
      expect(data.summary.totalServices).toBe(4);
      expect(data.summary.healthyServices).toBe(1);
      expect(data.summary.warningServices).toBe(1);
      expect(data.summary.criticalServices).toBe(2); // critical + down
      expect(data.summary.uptime).toBe('50.0'); // (1 healthy + 1 warning) / 4 total * 100
      expect(data.summary.avgResponseTime).toBe(150); // (100 + 0 + 500 + 0) / 4
      expect(data.summary.avgErrorRate).toBe(51.25); // (0 + 100 + 5 + 100) / 4
    });
  });
});

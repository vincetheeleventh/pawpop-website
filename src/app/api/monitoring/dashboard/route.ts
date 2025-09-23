import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';

/**
 * Monitoring Dashboard API Endpoint
 * 
 * GET /api/monitoring/dashboard
 * Returns comprehensive monitoring dashboard data
 */
export async function GET(req: NextRequest) {
  try {
    console.log('📊 Fetching monitoring dashboard data...');
    
    // Run health checks for all services
    const healthMetrics = await monitoring.runHealthCheck();
    
    // Get active alerts
    const activeAlerts = await monitoring.getActiveAlerts();
    
    // Calculate dashboard metrics
    const totalServices = healthMetrics.length;
    const healthyServices = healthMetrics.filter(m => m.status === 'healthy').length;
    const warningServices = healthMetrics.filter(m => m.status === 'warning').length;
    const criticalServices = healthMetrics.filter(m => m.status === 'critical' || m.status === 'down').length;
    
    const overallStatus = criticalServices > 0 ? 'critical' :
                         warningServices > 0 ? 'warning' : 'healthy';
    
    // Service-specific metrics
    const serviceMetrics = healthMetrics.reduce((acc, metric) => {
      acc[metric.service] = {
        status: metric.status,
        responseTime: metric.responseTime,
        errorRate: metric.errorRate,
        lastCheck: metric.lastCheck,
        details: metric.details
      };
      return acc;
    }, {} as Record<string, any>);
    
    // Alert summary
    const alertSummary = {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length,
      byService: {
        supabase: activeAlerts.filter(a => a.service === 'supabase').length,
        'fal-ai': activeAlerts.filter(a => a.service === 'fal-ai').length,
        stripe: activeAlerts.filter(a => a.service === 'stripe').length,
        printify: activeAlerts.filter(a => a.service === 'printify').length,
        system: activeAlerts.filter(a => a.service === 'system').length
      },
      recent: activeAlerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    };
    
    // Performance metrics
    const avgResponseTime = healthMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalServices;
    const avgErrorRate = healthMetrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / totalServices;
    
    const dashboardData = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      summary: {
        totalServices,
        healthyServices,
        warningServices,
        criticalServices,
        uptime: ((healthyServices + warningServices) / totalServices * 100).toFixed(1),
        avgResponseTime: Math.round(avgResponseTime),
        avgErrorRate: Math.round(avgErrorRate * 100) / 100
      },
      services: serviceMetrics,
      alerts: alertSummary,
      healthChecks: healthMetrics.map(m => ({
        service: m.service,
        status: m.status,
        responseTime: m.responseTime,
        lastCheck: m.lastCheck
      }))
    };
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      summary: {
        totalServices: 0,
        healthyServices: 0,
        warningServices: 0,
        criticalServices: 0,
        uptime: '0.0',
        avgResponseTime: 0,
        avgErrorRate: 0
      },
      services: {},
      alerts: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        byService: {},
        recent: []
      },
      healthChecks: []
    }, { status: 500 });
  }
}

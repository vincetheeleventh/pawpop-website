import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';

/**
 * Health Check API Endpoint
 * 
 * GET /api/monitoring/health
 * Returns comprehensive health status of all monitored services
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Running health check...');
    
    // Run comprehensive health check
    const healthMetrics = await monitoring.runHealthCheck();
    
    // Calculate overall system status
    const criticalServices = healthMetrics.filter(m => m.status === 'critical' || m.status === 'down');
    const warningServices = healthMetrics.filter(m => m.status === 'warning');
    
    const overallStatus = criticalServices.length > 0 ? 'critical' :
                         warningServices.length > 0 ? 'warning' : 'healthy';
    
    // Get active alerts
    const activeAlerts = await monitoring.getActiveAlerts();
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: healthMetrics,
      alerts: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
        recent: activeAlerts.slice(0, 5) // Last 5 alerts
      },
      summary: {
        totalServices: healthMetrics.length,
        healthyServices: healthMetrics.filter(m => m.status === 'healthy').length,
        warningServices: warningServices.length,
        criticalServices: criticalServices.length,
        avgResponseTime: healthMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / healthMetrics.length
      }
    };
    
    // Set appropriate HTTP status based on system health
    const httpStatus = overallStatus === 'critical' ? 503 :
                      overallStatus === 'warning' ? 200 : 200;
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      services: [],
      alerts: { total: 0, critical: 0, high: 0, medium: 0, low: 0, recent: [] },
      summary: { totalServices: 0, healthyServices: 0, warningServices: 0, criticalServices: 0, avgResponseTime: 0 }
    }, { status: 500 });
  }
}

/**
 * Manual Health Check Trigger
 * 
 * POST /api/monitoring/health
 * Triggers an immediate health check and returns results
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service } = body;
    
    console.log(`🔍 Running manual health check${service ? ` for ${service}` : ''}...`);
    
    let healthMetrics;
    
    if (service) {
      // Check specific service
      switch (service) {
        case 'supabase':
          healthMetrics = [await monitoring.checkSupabaseHealth()];
          break;
        case 'fal-ai':
          healthMetrics = [await monitoring.checkFalAiHealth()];
          break;
        case 'stripe':
          healthMetrics = [await monitoring.checkStripeHealth()];
          break;
        default:
          return NextResponse.json({ error: 'Invalid service name' }, { status: 400 });
      }
    } else {
      // Check all services
      healthMetrics = await monitoring.runHealthCheck();
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      services: healthMetrics,
      message: `Health check completed for ${service || 'all services'}`
    });
    
  } catch (error) {
    console.error('Manual health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Manual health check failed'
    }, { status: 500 });
  }
}

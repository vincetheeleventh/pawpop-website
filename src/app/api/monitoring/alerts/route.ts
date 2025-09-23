import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';

/**
 * Alerts Management API Endpoint
 * 
 * GET /api/monitoring/alerts - Get all active alerts
 * POST /api/monitoring/alerts - Create a new alert
 * PATCH /api/monitoring/alerts - Resolve an alert
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const service = searchParams.get('service');
    const resolved = searchParams.get('resolved') === 'true';
    
    console.log('📋 Fetching alerts...', { severity, service, resolved });
    
    // Get all active alerts
    const alerts = await monitoring.getActiveAlerts();
    
    // Filter alerts based on query parameters
    let filteredAlerts = alerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (service) {
      filteredAlerts = filteredAlerts.filter(alert => alert.service === service);
    }
    
    if (resolved !== null) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === resolved);
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      alerts: filteredAlerts,
      total: filteredAlerts.length,
      summary: {
        critical: filteredAlerts.filter(a => a.severity === 'critical').length,
        high: filteredAlerts.filter(a => a.severity === 'high').length,
        medium: filteredAlerts.filter(a => a.severity === 'medium').length,
        low: filteredAlerts.filter(a => a.severity === 'low').length,
        byService: {
          supabase: filteredAlerts.filter(a => a.service === 'supabase').length,
          'fal-ai': filteredAlerts.filter(a => a.service === 'fal-ai').length,
          stripe: filteredAlerts.filter(a => a.service === 'stripe').length,
          printify: filteredAlerts.filter(a => a.service === 'printify').length,
          system: filteredAlerts.filter(a => a.service === 'system').length
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      alerts: [],
      total: 0
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, severity, message, details } = body;
    
    // Validate required fields
    if (!service || !severity || !message) {
      return NextResponse.json({
        error: 'Missing required fields: service, severity, message'
      }, { status: 400 });
    }
    
    // Validate severity level
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json({
        error: 'Invalid severity level. Must be: low, medium, high, or critical'
      }, { status: 400 });
    }
    
    // Validate service name
    if (!['supabase', 'fal-ai', 'stripe', 'printify', 'system'].includes(service)) {
      return NextResponse.json({
        error: 'Invalid service name. Must be: supabase, fal-ai, stripe, printify, or system'
      }, { status: 400 });
    }
    
    console.log('🚨 Creating new alert:', { service, severity, message });
    
    // Create the alert
    await monitoring.createAlert({
      service,
      severity,
      message,
      details: details || {}
    });
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Alert created successfully'
    });
    
  } catch (error) {
    console.error('Failed to create alert:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to create alert'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, action } = body;
    
    if (!alertId) {
      return NextResponse.json({
        error: 'Missing required field: alertId'
      }, { status: 400 });
    }
    
    if (action !== 'resolve') {
      return NextResponse.json({
        error: 'Invalid action. Only "resolve" is supported'
      }, { status: 400 });
    }
    
    console.log('✅ Resolving alert:', alertId);
    
    // Resolve the alert
    await monitoring.resolveAlert(alertId);
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Alert resolved successfully',
      alertId
    });
    
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to resolve alert'
    }, { status: 500 });
  }
}

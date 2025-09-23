/**
 * Centralized Monitoring & Alerting System for PawPop
 * 
 * This module provides comprehensive monitoring for:
 * - Supabase connection limits and performance
 * - fal.ai API usage and rate limits
 * - Stripe webhook failures and retry logic
 * - System health checks and alerts
 */

import { createClient } from '@supabase/supabase-js';

// Types for monitoring data
export interface MonitoringAlert {
  id: string;
  service: 'supabase' | 'fal-ai' | 'stripe' | 'printify' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

export interface ServiceMetrics {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  responseTime?: number;
  errorRate?: number;
  lastCheck: Date;
  details: Record<string, any>;
}

export interface SupabaseMetrics {
  connectionCount: number;
  maxConnections: number;
  connectionUtilization: number;
  activeQueries: number;
  avgQueryTime: number;
  errorRate: number;
}

export interface FalAiMetrics {
  requestsToday: number;
  requestsThisMonth: number;
  costToday: number;
  costThisMonth: number;
  rateLimitRemaining: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface StripeMetrics {
  webhookSuccessRate: number;
  webhookFailures: number;
  lastWebhookTime: Date;
  paymentSuccessRate: number;
  avgProcessingTime: number;
}

// Alert thresholds configuration
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

// Monitoring class
export class MonitoringService {
  private supabase;
  private alerts: MonitoringAlert[] = [];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Check Supabase connection health and metrics
   */
  async checkSupabaseHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();
    
    try {
      // Get connection pool stats
      const { data: poolStats, error: poolError } = await this.supabase
        .rpc('get_connection_stats');

      if (poolError) {
        console.error('Failed to get Supabase connection stats:', poolError);
        return {
          service: 'supabase',
          status: 'critical',
          lastCheck: new Date(),
          details: { error: poolError.message }
        };
      }

      // Test query performance
      const { data: testQuery, error: queryError } = await this.supabase
        .from('artworks')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (queryError) {
        await this.createAlert({
          service: 'supabase',
          severity: 'high',
          message: 'Supabase query failed',
          details: { error: queryError.message, responseTime }
        });

        return {
          service: 'supabase',
          status: 'critical',
          responseTime,
          lastCheck: new Date(),
          details: { error: queryError.message }
        };
      }

      const metrics: SupabaseMetrics = {
        connectionCount: poolStats?.active_connections || 0,
        maxConnections: poolStats?.max_connections || 100,
        connectionUtilization: poolStats ? (poolStats.active_connections / poolStats.max_connections) * 100 : 0,
        activeQueries: poolStats?.active_queries || 0,
        avgQueryTime: responseTime,
        errorRate: 0 // Would need to calculate from logs
      };

      // Check thresholds and create alerts
      if (metrics.connectionUtilization > ALERT_THRESHOLDS.supabase.connectionUtilization) {
        await this.createAlert({
          service: 'supabase',
          severity: 'high',
          message: `High connection utilization: ${metrics.connectionUtilization.toFixed(1)}%`,
          details: metrics
        });
      }

      if (metrics.avgQueryTime > ALERT_THRESHOLDS.supabase.avgQueryTime) {
        await this.createAlert({
          service: 'supabase',
          severity: 'medium',
          message: `Slow query performance: ${metrics.avgQueryTime}ms`,
          details: metrics
        });
      }

      const status = metrics.connectionUtilization > 90 ? 'critical' :
                    metrics.connectionUtilization > 80 ? 'warning' : 'healthy';

      return {
        service: 'supabase',
        status,
        responseTime,
        lastCheck: new Date(),
        details: metrics
      };

    } catch (error) {
      console.error('Supabase health check failed:', error);
      
      await this.createAlert({
        service: 'supabase',
        severity: 'critical',
        message: 'Supabase health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        service: 'supabase',
        status: 'down',
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Monitor fal.ai API usage and performance
   */
  async checkFalAiHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // Get usage stats from our tracking table
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      const { data: dailyUsage } = await this.supabase
        .from('fal_ai_usage')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      const { data: monthlyUsage } = await this.supabase
        .from('fal_ai_usage')
        .select('*')
        .gte('created_at', thisMonth)
        .order('created_at', { ascending: false });

      const responseTime = Date.now() - startTime;

      // Calculate metrics
      const requestsToday = dailyUsage?.length || 0;
      const requestsThisMonth = monthlyUsage?.length || 0;
      const costToday = dailyUsage?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
      const costThisMonth = monthlyUsage?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
      
      const recentErrors = dailyUsage?.filter(record => record.status === 'error').length || 0;
      const errorRate = requestsToday > 0 ? (recentErrors / requestsToday) * 100 : 0;

      const metrics: FalAiMetrics = {
        requestsToday,
        requestsThisMonth,
        costToday,
        costThisMonth,
        rateLimitRemaining: 1000, // Would need to get from fal.ai headers
        avgResponseTime: responseTime,
        errorRate
      };

      // Check thresholds
      if (costToday > ALERT_THRESHOLDS.falAi.dailyCostLimit) {
        await this.createAlert({
          service: 'fal-ai',
          severity: 'high',
          message: `Daily fal.ai cost limit exceeded: $${costToday.toFixed(2)}`,
          details: metrics
        });
      }

      if (costThisMonth > ALERT_THRESHOLDS.falAi.monthlyCostLimit) {
        await this.createAlert({
          service: 'fal-ai',
          severity: 'critical',
          message: `Monthly fal.ai cost limit exceeded: $${costThisMonth.toFixed(2)}`,
          details: metrics
        });
      }

      if (errorRate > ALERT_THRESHOLDS.falAi.errorRate) {
        await this.createAlert({
          service: 'fal-ai',
          severity: 'medium',
          message: `High fal.ai error rate: ${errorRate.toFixed(1)}%`,
          details: metrics
        });
      }

      const status = costThisMonth > ALERT_THRESHOLDS.falAi.monthlyCostLimit ? 'critical' :
                    costToday > ALERT_THRESHOLDS.falAi.dailyCostLimit ? 'warning' :
                    errorRate > ALERT_THRESHOLDS.falAi.errorRate ? 'warning' : 'healthy';

      return {
        service: 'fal-ai',
        status,
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: metrics
      };

    } catch (error) {
      console.error('fal.ai health check failed:', error);
      
      await this.createAlert({
        service: 'fal-ai',
        severity: 'high',
        message: 'fal.ai health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        service: 'fal-ai',
        status: 'down',
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Monitor Stripe webhook health and payment processing
   */
  async checkStripeHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // Get recent webhook events from our tracking
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: webhookEvents } = await this.supabase
        .from('stripe_webhook_events')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });

      const { data: recentOrders } = await this.supabase
        .from('orders')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });

      const responseTime = Date.now() - startTime;

      // Calculate metrics
      const totalWebhooks = webhookEvents?.length || 0;
      const failedWebhooks = webhookEvents?.filter(event => event.status === 'failed').length || 0;
      const webhookSuccessRate = totalWebhooks > 0 ? ((totalWebhooks - failedWebhooks) / totalWebhooks) * 100 : 100;

      const totalPayments = recentOrders?.length || 0;
      const successfulPayments = recentOrders?.filter(order => order.status === 'completed').length || 0;
      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 100;

      const lastWebhookTime = webhookEvents?.[0]?.created_at ? new Date(webhookEvents[0].created_at) : new Date(0);

      const metrics: StripeMetrics = {
        webhookSuccessRate,
        webhookFailures: failedWebhooks,
        lastWebhookTime,
        paymentSuccessRate,
        avgProcessingTime: responseTime
      };

      // Check thresholds
      if (webhookSuccessRate < ALERT_THRESHOLDS.stripe.webhookSuccessRate) {
        await this.createAlert({
          service: 'stripe',
          severity: 'high',
          message: `Low Stripe webhook success rate: ${webhookSuccessRate.toFixed(1)}%`,
          details: metrics
        });
      }

      if (paymentSuccessRate < ALERT_THRESHOLDS.stripe.paymentSuccessRate) {
        await this.createAlert({
          service: 'stripe',
          severity: 'critical',
          message: `Low payment success rate: ${paymentSuccessRate.toFixed(1)}%`,
          details: metrics
        });
      }

      // Check for recent webhook activity (should have activity within last hour for active site)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (lastWebhookTime.getTime() < oneHourAgo && totalPayments > 0) {
        await this.createAlert({
          service: 'stripe',
          severity: 'medium',
          message: 'No recent Stripe webhook activity detected',
          details: { ...metrics, lastWebhookTime: lastWebhookTime.toISOString() }
        });
      }

      const status = paymentSuccessRate < ALERT_THRESHOLDS.stripe.paymentSuccessRate ? 'critical' :
                    webhookSuccessRate < ALERT_THRESHOLDS.stripe.webhookSuccessRate ? 'warning' :
                    failedWebhooks > ALERT_THRESHOLDS.stripe.webhookFailureThreshold ? 'warning' : 'healthy';

      return {
        service: 'stripe',
        status,
        responseTime,
        errorRate: 100 - webhookSuccessRate,
        lastCheck: new Date(),
        details: metrics
      };

    } catch (error) {
      console.error('Stripe health check failed:', error);
      
      await this.createAlert({
        service: 'stripe',
        severity: 'high',
        message: 'Stripe health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        service: 'stripe',
        status: 'down',
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Create and store monitoring alert
   */
  async createAlert(alertData: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: MonitoringAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    // Store alert in database
    try {
      await this.supabase
        .from('monitoring_alerts')
        .insert(alert);

      // Send notification
      await this.sendAlertNotification(alert);
      
      console.log(`🚨 Alert created: [${alert.severity.toUpperCase()}] ${alert.service} - ${alert.message}`);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }

    // Keep in memory for immediate access
    this.alerts.push(alert);
  }

  /**
   * Send alert notification via email/Slack
   */
  async sendAlertNotification(alert: MonitoringAlert): Promise<void> {
    try {
      // For now, we'll use the existing email system
      // In production, you might want to integrate with Slack, PagerDuty, etc.
      
      const { sendSystemAlertEmail } = await import('@/lib/email');
      
      await sendSystemAlertEmail({
        alertId: alert.id,
        service: alert.service,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        timestamp: alert.timestamp
      });

    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<MonitoringAlert[]> {
    try {
      const { data: alerts } = await this.supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      return alerts || [];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('monitoring_alerts')
        .update({ resolved: true })
        .eq('id', alertId);

      console.log(`✅ Alert resolved: ${alertId}`);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  /**
   * Run comprehensive health check on all services
   */
  async runHealthCheck(): Promise<ServiceMetrics[]> {
    console.log('🔍 Running comprehensive health check...');
    
    const results = await Promise.allSettled([
      this.checkSupabaseHealth(),
      this.checkFalAiHealth(),
      this.checkStripeHealth()
    ]);

    const metrics: ServiceMetrics[] = [];
    
    results.forEach((result, index) => {
      const services = ['supabase', 'fal-ai', 'stripe'];
      
      if (result.status === 'fulfilled') {
        metrics.push(result.value);
      } else {
        console.error(`Health check failed for ${services[index]}:`, result.reason);
        metrics.push({
          service: services[index],
          status: 'down',
          lastCheck: new Date(),
          details: { error: result.reason?.message || 'Health check failed' }
        });
      }
    });

    return metrics;
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Utility functions for tracking API usage
export async function trackFalAiUsage(data: {
  endpoint: string;
  requestId: string;
  status: 'success' | 'error';
  responseTime: number;
  cost?: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('fal_ai_usage')
      .insert({
        endpoint: data.endpoint,
        request_id: data.requestId,
        status: data.status,
        response_time: data.responseTime,
        cost: data.cost || 0,
        error_message: data.errorMessage,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to track fal.ai usage:', error);
  }
}

export async function trackStripeWebhook(data: {
  eventId: string;
  eventType: string;
  status: 'success' | 'failed';
  processingTime: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: data.eventId,
        event_type: data.eventType,
        status: data.status,
        processing_time: data.processingTime,
        error_message: data.errorMessage,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to track Stripe webhook:', error);
  }
}

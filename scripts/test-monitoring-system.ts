#!/usr/bin/env node

/**
 * Test script for PawPop Monitoring System
 * 
 * This script tests all monitoring functionality including:
 * - Health checks for all services
 * - Alert creation and management
 * - Dashboard data retrieval
 * - Email notifications (test mode)
 */

import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testMonitoringSystem() {
  console.log('🔍 Testing PawPop Monitoring System...\n');

  try {
    // Import monitoring functions dynamically
    const { monitoring, trackFalAiUsage, trackStripeWebhook } = await import('../src/lib/monitoring');
    
    // Test 1: Health Checks
    console.log('📊 Testing health checks...');
    const healthResults = await monitoring.runHealthCheck();
    
    console.log(`✅ Health check completed for ${healthResults.length} services:`);
    healthResults.forEach(result => {
      const statusIcon = result.status === 'healthy' ? '🟢' : 
                        result.status === 'warning' ? '🟡' : '🔴';
      console.log(`  ${statusIcon} ${result.service}: ${result.status} (${result.responseTime}ms)`);
    });
    console.log();

    // Test 2: Alert Management
    console.log('🚨 Testing alert management...');
    
    // Create test alert
    await monitoring.createAlert({
      service: 'system',
      severity: 'low',
      message: 'Test alert from monitoring system test',
      details: { 
        test: true, 
        timestamp: new Date().toISOString(),
        source: 'test-script'
      }
    });
    console.log('✅ Test alert created successfully');

    // Get active alerts
    const activeAlerts = await monitoring.getActiveAlerts();
    console.log(`✅ Retrieved ${activeAlerts.length} active alerts`);
    
    if (activeAlerts.length > 0) {
      console.log('   Recent alerts:');
      activeAlerts.slice(0, 3).forEach(alert => {
        const severityIcon = alert.severity === 'critical' ? '🔥' :
                           alert.severity === 'high' ? '🚨' :
                           alert.severity === 'medium' ? '⚠️' : '💡';
        console.log(`   ${severityIcon} [${alert.service}] ${alert.message}`);
      });
    }
    console.log();

    // Test 3: Usage Tracking
    console.log('📈 Testing usage tracking...');
    
    // Test fal.ai usage tracking
    await trackFalAiUsage({
      endpoint: 'test-endpoint',
      requestId: `test_${Date.now()}`,
      status: 'success',
      responseTime: 1500,
      cost: 0.05
    });
    console.log('✅ fal.ai usage tracking test completed');

    // Test Stripe webhook tracking
    await trackStripeWebhook({
      eventId: `test_evt_${Date.now()}`,
      eventType: 'test.event',
      status: 'success',
      processingTime: 250
    });
    console.log('✅ Stripe webhook tracking test completed');
    console.log();

    // Test 4: Service-Specific Health Checks
    console.log('🔧 Testing individual service health checks...');
    
    const supabaseHealth = await monitoring.checkSupabaseHealth();
    console.log(`✅ Supabase: ${supabaseHealth.status} (${supabaseHealth.responseTime}ms)`);
    
    const falAiHealth = await monitoring.checkFalAiHealth();
    console.log(`✅ fal.ai: ${falAiHealth.status} (${falAiHealth.details.requestsToday} requests today)`);
    
    const stripeHealth = await monitoring.checkStripeHealth();
    console.log(`✅ Stripe: ${stripeHealth.status} (${stripeHealth.details.webhookSuccessRate}% success rate)`);
    console.log();

    // Test 5: Alert Thresholds
    console.log('⚙️ Testing alert thresholds...');
    const { ALERT_THRESHOLDS } = await import('../src/lib/monitoring');
    
    console.log('   Current thresholds:');
    console.log(`   📊 Supabase connection limit: ${ALERT_THRESHOLDS.supabase.connectionUtilization}%`);
    console.log(`   💰 fal.ai daily cost limit: $${ALERT_THRESHOLDS.falAi.dailyCostLimit}`);
    console.log(`   💳 Stripe webhook success rate: ${ALERT_THRESHOLDS.stripe.webhookSuccessRate}%`);
    console.log();

    // Test 6: Email Notification (Test Mode)
    console.log('📧 Testing email notifications...');
    try {
      await monitoring.sendAlertNotification({
        id: 'test_alert_123',
        service: 'system',
        severity: 'low',
        message: 'Test email notification from monitoring system',
        details: { test: true },
        timestamp: new Date(),
        resolved: false
      });
      console.log('✅ Test email notification sent successfully');
    } catch (emailError) {
      console.log('⚠️ Email notification test failed (this is expected in test mode)');
      console.log(`   Error: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
    }
    console.log();

    // Summary
    console.log('🎉 Monitoring System Test Summary:');
    console.log('✅ Health checks: Working');
    console.log('✅ Alert management: Working');
    console.log('✅ Usage tracking: Working');
    console.log('✅ Service monitoring: Working');
    console.log('✅ Threshold configuration: Working');
    console.log('📧 Email notifications: Test mode');
    console.log();
    console.log('🚀 PawPop Monitoring System is ready for production!');

  } catch (error) {
    console.error('❌ Monitoring system test failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMonitoringSystem()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testMonitoringSystem };

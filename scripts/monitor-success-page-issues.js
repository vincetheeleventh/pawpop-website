#!/usr/bin/env node

/**
 * Success Page Issue Monitor
 * Tracks patterns of success page failures and provides insights
 */

const fs = require('fs');
const path = require('path');

class SuccessPageMonitor {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/success-page-issues.json');
    this.ensureLogFile();
  }

  ensureLogFile() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, JSON.stringify([], null, 2));
    }
  }

  logIssue(issue) {
    const logs = this.getLogs();
    logs.push({
      ...issue,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
  }

  getLogs() {
    try {
      return JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
    } catch {
      return [];
    }
  }

  analyzePatterns() {
    const logs = this.getLogs();
    const last24h = logs.filter(log => 
      Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const analysis = {
      total_issues_24h: last24h.length,
      issue_types: {},
      retry_patterns: {},
      session_failures: {},
      time_distribution: {},
      recommendations: []
    };

    // Analyze issue types
    last24h.forEach(log => {
      analysis.issue_types[log.type] = (analysis.issue_types[log.type] || 0) + 1;
      
      if (log.retryCount) {
        analysis.retry_patterns[log.retryCount] = (analysis.retry_patterns[log.retryCount] || 0) + 1;
      }
      
      if (log.sessionId) {
        analysis.session_failures[log.sessionId] = (analysis.session_failures[log.sessionId] || 0) + 1;
      }
      
      const hour = new Date(log.timestamp).getHours();
      analysis.time_distribution[hour] = (analysis.time_distribution[hour] || 0) + 1;
    });

    // Generate recommendations
    if (analysis.issue_types['webhook_failure'] > 5) {
      analysis.recommendations.push('HIGH: Multiple webhook failures detected - check Stripe webhook configuration');
    }
    
    if (analysis.issue_types['database_timeout'] > 3) {
      analysis.recommendations.push('MEDIUM: Database timeout issues - consider connection pool optimization');
    }
    
    if (analysis.retry_patterns['5'] > 10) {
      analysis.recommendations.push('HIGH: Many sessions requiring max retries - investigate webhook delivery');
    }

    return analysis;
  }

  generateReport() {
    const analysis = this.analyzePatterns();
    
    console.log('🔍 SUCCESS PAGE ISSUE ANALYSIS (Last 24h)');
    console.log('==========================================');
    console.log(`Total Issues: ${analysis.total_issues_24h}`);
    
    console.log('\n📊 Issue Types:');
    Object.entries(analysis.issue_types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n🔄 Retry Patterns:');
    Object.entries(analysis.retry_patterns).forEach(([retries, count]) => {
      console.log(`  ${retries} retries: ${count} sessions`);
    });
    
    console.log('\n⏰ Time Distribution:');
    Object.entries(analysis.time_distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([hour, count]) => {
        console.log(`  ${hour.padStart(2, '0')}:00: ${count} issues`);
      });
    
    if (analysis.recommendations.length > 0) {
      console.log('\n🚨 RECOMMENDATIONS:');
      analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    return analysis;
  }

  // Simulate logging different types of issues for testing
  simulateIssues() {
    const issueTypes = [
      { type: 'webhook_failure', sessionId: 'cs_test_123', retryCount: 5 },
      { type: 'database_timeout', sessionId: 'cs_test_456', retryCount: 3 },
      { type: 'network_error', sessionId: 'cs_test_789', retryCount: 2 },
      { type: '404_not_found', sessionId: 'cs_test_abc', retryCount: 4 }
    ];
    
    issueTypes.forEach(issue => this.logIssue(issue));
    console.log('✅ Simulated issues logged');
  }
}

// CLI interface
const monitor = new SuccessPageMonitor();

const command = process.argv[2];
switch (command) {
  case 'report':
    monitor.generateReport();
    break;
  case 'simulate':
    monitor.simulateIssues();
    break;
  case 'log':
    const issue = {
      type: process.argv[3] || 'unknown',
      sessionId: process.argv[4] || 'unknown',
      retryCount: parseInt(process.argv[5]) || 0,
      details: process.argv[6] || ''
    };
    monitor.logIssue(issue);
    console.log('✅ Issue logged:', issue);
    break;
  default:
    console.log('Usage:');
    console.log('  node monitor-success-page-issues.js report     - Generate analysis report');
    console.log('  node monitor-success-page-issues.js simulate   - Simulate test issues');
    console.log('  node monitor-success-page-issues.js log <type> <sessionId> <retryCount> <details>');
}

module.exports = SuccessPageMonitor;

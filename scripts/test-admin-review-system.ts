#!/usr/bin/env tsx

/**
 * Comprehensive Admin Review System Test Runner
 * 
 * This script runs all admin review system tests in sequence:
 * 1. Unit tests for core functions
 * 2. API endpoint tests
 * 3. Component tests
 * 4. Integration tests
 * 5. E2E tests with Playwright
 * 
 * Usage: npm run test:admin-review
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import chalk from 'chalk'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

class AdminReviewTestRunner {
  private results: TestResult[] = []

  async runTest(name: string, command: string): Promise<TestResult> {
    console.log(chalk.blue(`\n🧪 Running ${name}...`))
    const startTime = Date.now()
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000 // 2 minutes timeout
      })
      
      const duration = Date.now() - startTime
      const result: TestResult = { name, passed: true, duration }
      
      console.log(chalk.green(`✅ ${name} passed (${duration}ms)`))
      this.results.push(result)
      return result
      
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result: TestResult = { 
        name, 
        passed: false, 
        duration, 
        error: error.message 
      }
      
      console.log(chalk.red(`❌ ${name} failed (${duration}ms)`))
      console.log(chalk.red(`Error: ${error.message}`))
      this.results.push(result)
      return result
    }
  }

  async runAllTests(): Promise<void> {
    console.log(chalk.cyan('🚀 Starting Admin Review System Test Suite\n'))

    // Check if required test files exist
    const testFiles = [
      'tests/lib/admin-review-simple.test.ts',
      'tests/api/admin-reviews-simple.test.ts',
      'tests/components/AdminReviewDashboard.test.tsx',
      'tests/integration/admin-review-flow.test.ts',
      'tests/e2e/admin-review-system.spec.ts',
      'tests/e2e/admin-review-order-flow.spec.ts',
      'tests/e2e/admin-review-email-flow.spec.ts'
    ]

    const missingFiles = testFiles.filter(file => !existsSync(file))
    if (missingFiles.length > 0) {
      console.log(chalk.yellow('⚠️  Missing test files:'))
      missingFiles.forEach(file => console.log(chalk.yellow(`   - ${file}`)))
      console.log()
    }

    // 1. Unit Tests - Core Functions
    await this.runTest(
      'Core Function Tests',
      'npm test -- tests/lib/admin-review-simple.test.ts --reporter=verbose'
    )

    // 2. API Endpoint Tests
    await this.runTest(
      'API Endpoint Tests',
      'npm test -- tests/api/admin-reviews-simple.test.ts --reporter=verbose'
    )

    // 3. Component Tests (if exists)
    if (existsSync('tests/components/AdminReviewDashboard.test.tsx')) {
      await this.runTest(
        'Component Tests',
        'npm test -- tests/components/AdminReviewDashboard.test.tsx --reporter=verbose'
      )
    }

    // 4. Integration Tests (if exists)
    if (existsSync('tests/integration/admin-review-flow.test.ts')) {
      await this.runTest(
        'Integration Tests',
        'npm test -- tests/integration/admin-review-flow.test.ts --reporter=verbose'
      )
    }

    // 5. E2E Tests with Playwright (if Playwright is available)
    try {
      execSync('npx playwright --version', { stdio: 'pipe' })
      
      if (existsSync('tests/e2e/admin-review-system.spec.ts')) {
        await this.runTest(
          'E2E Dashboard Tests',
          'npx playwright test tests/e2e/admin-review-system.spec.ts --reporter=list'
        )
      }

      if (existsSync('tests/e2e/admin-review-order-flow.spec.ts')) {
        await this.runTest(
          'E2E Order Flow Tests',
          'npx playwright test tests/e2e/admin-review-order-flow.spec.ts --reporter=list'
        )
      }

      if (existsSync('tests/e2e/admin-review-email-flow.spec.ts')) {
        await this.runTest(
          'E2E Email Flow Tests',
          'npx playwright test tests/e2e/admin-review-email-flow.spec.ts --reporter=list'
        )
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Playwright not available, skipping E2E tests'))
    }

    // 6. Environment Toggle Tests
    await this.runTest(
      'Environment Toggle Tests',
      'ENABLE_HUMAN_REVIEW=false npm test -- tests/lib/admin-review-simple.test.ts --grep="should return false when human review is disabled"'
    )

    await this.runTest(
      'Environment Enable Tests',
      'ENABLE_HUMAN_REVIEW=true npm test -- tests/lib/admin-review-simple.test.ts --grep="should return true when human review is enabled"'
    )

    // Print summary
    this.printSummary()
  }

  private printSummary(): void {
    console.log(chalk.cyan('\n📊 Test Summary'))
    console.log(chalk.cyan('================'))

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`Total Tests: ${this.results.length}`)
    console.log(chalk.green(`Passed: ${passed}`))
    console.log(chalk.red(`Failed: ${failed}`))
    console.log(`Total Duration: ${totalDuration}ms`)

    if (failed > 0) {
      console.log(chalk.red('\n❌ Failed Tests:'))
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(chalk.red(`   - ${r.name}: ${r.error}`))
        })
    }

    console.log(chalk.cyan('\n🔧 Admin Review System Status:'))
    
    const coreTests = this.results.find(r => r.name === 'Core Function Tests')
    const apiTests = this.results.find(r => r.name === 'API Endpoint Tests')
    
    if (coreTests?.passed && apiTests?.passed) {
      console.log(chalk.green('✅ Core functionality working'))
      console.log(chalk.green('✅ API endpoints functional'))
      
      if (failed === 0) {
        console.log(chalk.green('✅ Admin review system fully operational'))
        console.log(chalk.green('🚀 Ready for production deployment'))
      } else {
        console.log(chalk.yellow('⚠️  Some advanced features may have issues'))
        console.log(chalk.yellow('🔍 Check failed tests above'))
      }
    } else {
      console.log(chalk.red('❌ Core functionality issues detected'))
      console.log(chalk.red('🚫 Not ready for production'))
    }

    console.log(chalk.cyan('\n📋 Next Steps:'))
    console.log('1. Fix any failed tests')
    console.log('2. Apply database migrations')
    console.log('3. Set ENABLE_HUMAN_REVIEW=true in production')
    console.log('4. Verify email notifications work')
    console.log('5. Test admin dashboard access')

    // Exit with error code if any tests failed
    if (failed > 0) {
      process.exit(1)
    }
  }
}

// Run the test suite
const runner = new AdminReviewTestRunner()
runner.runAllTests().catch(error => {
  console.error(chalk.red('Test runner failed:'), error)
  process.exit(1)
})

// Test script to debug the generation flow
console.log('🔍 Environment Variables Check:');
console.log('ENABLE_HUMAN_REVIEW:', process.env.ENABLE_HUMAN_REVIEW);
console.log('EMAIL_TEST_MODE:', process.env.EMAIL_TEST_MODE);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');

// Test if human review is enabled
const isHumanReviewEnabled = () => {
  return process.env.ENABLE_HUMAN_REVIEW === 'true'
}

console.log('🧪 Human Review Enabled:', isHumanReviewEnabled());

// Test email configuration
const isTestMode = process.env.EMAIL_TEST_MODE === 'true'
console.log('📧 Email Test Mode:', isTestMode);

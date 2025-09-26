require('dotenv').config({ path: '.env.local' });
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
console.log('Local env loaded correctly:', !!process.env.STRIPE_SECRET_KEY);

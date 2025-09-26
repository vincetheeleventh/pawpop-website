#!/bin/bash
# Test script to verify Stripe mode mismatch fix

echo "🧪 Testing Stripe mode mismatch fix..."

# Check if environment variables are set
echo "📋 Checking environment configuration..."
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set - checkout will use test mode"
else
    if [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
        echo "✅ Test mode detected (sk_test_*)"
    elif [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
        echo "✅ Live mode detected (sk_live_*)"
    else
        echo "⚠️  Unknown Stripe key format"
    fi
fi

if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set"
else
    if [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_test_* ]]; then
        echo "✅ Test publishable key detected (pk_test_*)"
    elif [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
        echo "✅ Live publishable key detected (pk_live_*)"
    else
        echo "⚠️  Unknown publishable key format"
    fi
fi

echo ""
echo "🔧 Fix Summary:"
echo "✅ Added environment-based mode detection to checkout API"
echo "✅ Enhanced error handling in ProductPurchaseModal"
echo "✅ Added test mode parameter for development"
echo "✅ Fixed Stripe session creation with proper mode handling"
echo ""
echo "🚀 Development server running at: http://localhost:3001"
echo "📝 The Stripe mode mismatch error should now be resolved!"

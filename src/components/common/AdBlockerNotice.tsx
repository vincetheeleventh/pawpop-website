'use client';

import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';

export default function AdBlockerNotice() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the notice
    const dismissed = localStorage.getItem('adblocker-notice-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Test if Stripe and Plausible are blocked
    const checkBlocking = async () => {
      let stripeBlocked = false;
      let plausibleBlocked = false;

      // Test Stripe
      try {
        const testStripe = await import('@stripe/stripe-js');
        if (testStripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          const stripe = await testStripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          if (!stripe) {
            stripeBlocked = true;
          }
        }
      } catch (error) {
        stripeBlocked = true;
      }

      // Test Plausible
      if (typeof window !== 'undefined') {
        // Wait a bit for Plausible to load
        setTimeout(() => {
          if (!window.plausible) {
            plausibleBlocked = true;
          }
          
          // Show notice if either is blocked
          if (stripeBlocked || plausibleBlocked) {
            setIsBlocked(true);
          }
        }, 2000);
      }
    };

    checkBlocking();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('adblocker-notice-dismissed', 'true');
  };

  if (!isBlocked || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-geist font-semibold text-yellow-800">
            Ad Blocker Detected
          </h4>
          <p className="text-xs text-yellow-700 font-geist mt-1">
            Some features may not work properly. Consider disabling your ad blocker for the best experience.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

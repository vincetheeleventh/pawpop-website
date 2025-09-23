// src/components/analytics/PlausibleScript.tsx

'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { plausible } from '@/lib/plausible';

interface PlausibleScriptProps {
  domain?: string;
  src?: string;
}

export default function PlausibleScript({ 
  domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'pawpopart.com',
  src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/plausible.js'
}: PlausibleScriptProps) {
  
  useEffect(() => {
    // Initialize price variant on component mount
    const variant = plausible.getPriceVariant();
    console.log('[PlausibleScript] Initialized with price variant:', variant);
    
    // Track initial page load with variant
    plausible.trackPageview(window.location.pathname, {
      initial_load: true,
      user_agent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    });
  }, []);

  if (!domain) {
    console.warn('[PlausibleScript] No domain configured, Plausible tracking disabled');
    return null;
  }

  // Temporarily disable external script while keeping A/B testing
  // TODO: Re-enable once Plausible account is fully configured
  console.log('[PlausibleScript] A/B testing active, external tracking temporarily disabled');
  
  return null;
  
  // Uncomment when Plausible is ready:
  /*
  return (
    <Script
      defer
      data-domain={domain}
      data-api="/api/event"
      src={src}
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[PlausibleScript] Plausible script loaded successfully');
        
        // Verify plausible is available
        if (typeof window !== 'undefined' && window.plausible) {
          console.log('[PlausibleScript] Plausible tracking active');
        }
      }}
      onError={(error) => {
        console.error('[PlausibleScript] Failed to load Plausible script:', error);
      }}
    />
  );
  */
}

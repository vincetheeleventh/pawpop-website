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
  domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'
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
}

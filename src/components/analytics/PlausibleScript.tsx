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
  src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'
}: PlausibleScriptProps) {
  
  useEffect(() => {
    // Only initialize once when component mounts
    if (typeof window !== 'undefined' && domain) {
      // Initialize price variant on component mount (no tracking here to avoid loops)
      const variant = plausible.getPriceVariant();
      console.log('[PlausibleScript] Initialized with price variant:', variant);
    }
  }, []); // Empty dependency array to run only once

  if (!domain) {
    console.warn('[PlausibleScript] No domain configured, Plausible tracking disabled');
    return null;
  }

  return (
    <>
      {/* Standard Plausible script */}
      <Script
        defer
        data-domain={domain}
        src={src}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[PlausibleScript] Plausible script loaded successfully');
          
          // Verify plausible is available and track initial load once
          if (typeof window !== 'undefined' && window.plausible) {
            console.log('[PlausibleScript] Plausible tracking active');
            
            // Track initial page load with variant (only once on script load)
            const variant = plausible.getPriceVariant();
            window.plausible('pageview', { 
              props: { 
                price_variant: variant,
                initial_load: true,
                user_agent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
              } 
            });
          }
        }}
        onError={(error) => {
          console.error('[PlausibleScript] Failed to load Plausible script:', error);
        }}
      />
      
      {/* Plausible queue initialization script */}
      <Script
        id="plausible-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
        }}
      />
    </>
  );
}

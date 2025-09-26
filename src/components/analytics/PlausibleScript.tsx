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
  src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js'
}: PlausibleScriptProps) {
  
  useEffect(() => {
    // Initialize price variant on component mount
    const variant = plausible.getPriceVariant();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PlausibleScript] Initialized with price variant:', variant);
    }
    
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
    <>
      {/* Enhanced Plausible script with file downloads, hash routing, outbound links, pageview props, and tagged events */}
      <Script
        defer
        data-domain={domain}
        src={src}
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[PlausibleScript] Enhanced Plausible script loaded successfully');
            
            // Verify plausible is available
            if (typeof window !== 'undefined' && window.plausible) {
              console.log('[PlausibleScript] Plausible tracking active with enhanced features');
            }
          }
        }}
        onError={(error) => {
          console.warn('[PlausibleScript] Plausible blocked by ad blocker - analytics will use fallback mode');
          
          // Set up fallback tracking when Plausible is blocked
          if (typeof window !== 'undefined') {
            window.plausible = window.plausible || function() {
              // Silent fallback - don't spam console with errors
              return;
            };
          }
        }}
      />
      
      {/* Plausible queue initialization script */}
      <Script
        id="plausible-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
        }}
      />
    </>
  );
}

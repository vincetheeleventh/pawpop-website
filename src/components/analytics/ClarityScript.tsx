'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { clarity } from '@/lib/clarity';
import { plausible } from '@/lib/plausible';

/**
 * Microsoft Clarity tracking script component
 * Integrates with Plausible for price variant tracking
 */
export default function ClarityScript() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId) return;

    // Initialize Clarity
    clarity.initialize();

    // Set initial tags from Plausible price variant
    try {
      const priceVariant = plausible.getPriceVariant();
      const priceConfig = plausible.getPriceConfig();

      clarity.setTags({
        price_variant: priceVariant,
        variant_label: priceConfig.label,
        environment: process.env.NODE_ENV || 'development'
      });

      console.log('[Clarity] Initial tags set:', {
        price_variant: priceVariant,
        variant_label: priceConfig.label
      });
    } catch (error) {
      console.error('[Clarity] Error setting initial tags:', error);
    }
  }, [projectId]);

  // Don't render script if no project ID
  if (!projectId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");
        `,
      }}
    />
  );
}

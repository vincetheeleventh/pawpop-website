// src/components/analytics/HotjarScript.tsx

'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface HotjarScriptProps {
  hjid?: string;
  hjsv?: string;
}

export default function HotjarScript({ 
  hjid = process.env.NEXT_PUBLIC_HOTJAR_ID,
  hjsv = process.env.NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION || '6'
}: HotjarScriptProps) {
  
  useEffect(() => {
    // Log initialization status
    if (typeof window !== 'undefined' && hjid) {
      console.log('[HotjarScript] Hotjar initialized with ID:', hjid);
    }
  }, [hjid]);

  // Don't load if no Hotjar ID is configured
  if (!hjid) {
    console.warn('[HotjarScript] No Hotjar ID configured, Hotjar tracking disabled');
    return null;
  }

  return (
    <Script
      id="hotjar-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `
      }}
      onLoad={() => {
        console.log('[HotjarScript] Hotjar script loaded successfully');
        
        // Verify Hotjar is available
        if (typeof window !== 'undefined' && (window as any).hj) {
          console.log('[HotjarScript] Hotjar tracking active');
        }
      }}
      onError={(error) => {
        console.error('[HotjarScript] Failed to load Hotjar script:', error);
      }}
    />
  );
}

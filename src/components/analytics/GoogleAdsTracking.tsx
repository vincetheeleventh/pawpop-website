'use client'

import Script from 'next/script';

interface GoogleAdsTrackingProps {
  conversionId?: string;
}

export function GoogleAdsTracking({ 
  conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID 
}: GoogleAdsTrackingProps) {
  if (!conversionId) {
    console.warn('Google Ads: No conversion ID provided');
    return null;
  }

  return (
    <>
      {/* Google Ads gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${conversionId}`}
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Google Ads: Script loaded successfully');
        }}
      />
      
      {/* Initialize gtag */}
      <Script
        id="google-ads-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${conversionId}');
          `,
        }}
      />
    </>
  );
}

'use client'

import { useEffect } from 'react';
import { initGoogleAds } from '@/lib/google-ads';

interface GoogleAdsTrackingProps {
  conversionId?: string;
}

export function GoogleAdsTracking({ 
  conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID 
}: GoogleAdsTrackingProps) {
  useEffect(() => {
    if (!conversionId) {
      console.warn('Google Ads: No conversion ID provided');
      return;
    }

    // Initialize Google Ads tracking
    initGoogleAds(conversionId);
  }, [conversionId]);

  return null; // This component doesn't render anything
}

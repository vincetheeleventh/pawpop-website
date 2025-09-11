// app/providers.tsx
'use client'

import { GoogleAdsTracking } from '@/components/analytics/GoogleAdsTracking';

export function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {
  return (
    <div data-theme="pawpop">
      <GoogleAdsTracking />
      {children}
    </div>
  )
}

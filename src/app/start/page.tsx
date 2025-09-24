'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with upload parameter
    router.replace('/?upload=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-site-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-atomic-tangerine mx-auto mb-4"></div>
        <p className="text-text-primary">Opening upload...</p>
      </div>
    </div>
  );
}

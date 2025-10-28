import { Metadata } from 'next';
import { Suspense } from 'react';
import Pop5PackSuccess from '@/components/pop5pack/Pop5PackSuccess';

export const metadata: Metadata = {
  title: 'Purchase Complete! | PawPop',
  description: 'Your Pop 5-Pack is being generated. Check your email for download links!',
};

export default function Pop5PackSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-site-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyclamen mx-auto mb-4"></div>
        <p className="font-geist text-text-primary">Loading...</p>
      </div>
    </div>}>
      <Pop5PackSuccess />
    </Suspense>
  );
}

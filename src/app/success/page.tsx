'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
  const [userEmail, setUserEmail] = useState<string>('');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Here you would typically verify the payment with your backend
    // and update your database accordingly
    if (sessionId) {
      // Example: Send sessionId to your API to verify the payment
      console.log('Payment successful for session:', sessionId);
      
      // Get user email from localStorage if available
      if (typeof window !== 'undefined') {
        const email = localStorage.getItem('userEmail');
        if (email) setUserEmail(email);
      }
      
      // Track conversion if gtag is available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: sessionId,
          // Add other relevant purchase data
        });
      }
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Payment Successful!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Thank you for your purchase. Your order has been processed successfully.
          </p>
          
          <div className="mt-10">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Order Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Details about your order
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Order number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {sessionId || 'Loading...'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date().toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-green-600">
                      Payment completed
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {/* In a real app, you would fetch this from your backend */}
                      {userEmail || 'your@email.com'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-10 border-t border-gray-200 pt-10">
            <h2 className="text-lg font-medium text-gray-900">Need help?</h2>
            <p className="mt-2 text-base text-gray-500">
              Have questions about your order?{' '}
              <a href="mailto:support@pawpop.com" className="text-blue-600 hover:text-blue-500">
                Contact our support team
              </a>{' '}
              and we'll be happy to help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

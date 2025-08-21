'use client';

import { useState } from 'react';
import CheckoutButton from '@/components/stripe/CheckoutButton';

export default function TestCheckoutPage() {
  const [error, setError] = useState<string | null>(null);
  
  const testProduct = {
    id: 'custom_portrait_mona_lisa',
    name: 'Custom Portrait with Pets: Mona Lisa Homage (Digital File)',
    description: 'Digital file of a custom portrait featuring your pets in the style of the Mona Lisa',
    price: 3900, // $39.00 in cents
    priceId: 'price_1Ry2nh2Vs1oVw2vZqeVYSZBh', // Your actual Stripe price ID
    currency: 'cad',
    features: [
      'High-resolution digital file',
      'Custom pet portrait',
      'Mona Lisa artistic style',
      'Instant digital delivery'
    ]
  };
  
  const handleError = (err: Error) => {
    console.error('Checkout error:', err);
    setError(err.message);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Stripe Checkout</h1>
        
        <div className="mb-6 p-6 border border-gray-200 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{testProduct.name}</h2>
            <p className="text-gray-600">{testProduct.description}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-3xl font-bold text-center text-gray-900 mb-2">
              ${(testProduct.price / 100).toFixed(2)}
            </p>
            <p className="text-sm text-center text-gray-500">One-time payment</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
            <ul className="space-y-2">
              {testProduct.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4">
            {error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Make sure you have set up your <code className="bg-yellow-100 px-1 rounded">.env.local</code> with your Stripe test keys.
                    The test price ID is set to <code className="bg-yellow-100 px-1 rounded">price_123</code> - update it to match your test product in Stripe.
                  </p>
                </div>
              </div>
            </div>
            <CheckoutButton
              priceId={testProduct.priceId}
              itemName={testProduct.name}
              amount={testProduct.price}
              quantity={1}
              className="w-full"
              onError={handleError}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Test Card Details:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>Card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code></li>
            <li>Expiry: Any future date</li>
            <li>CVC: Any 3 digits</li>
            <li>Postal: Any 5 digits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

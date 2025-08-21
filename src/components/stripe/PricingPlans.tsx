'use client';

import { useState } from 'react';
import { sampleProducts, Product, formatPrice } from '@/lib/stripe-utils';
import CheckoutButton from './CheckoutButton';

interface PricingPlansProps {
  products?: Product[];
  showMonthlyToggle?: boolean;
}

export default function PricingPlans({
  products = sampleProducts,
  showMonthlyToggle = true,
}: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  // Toggle between monthly and yearly billing
  const toggleBillingInterval = () => {
    setBillingInterval(prev => (prev === 'month' ? 'year' : 'month'));
  };

  // Apply discount for yearly billing (example: 20% off)
  const getDiscountedPrice = (price: number) => {
    return billingInterval === 'year' ? Math.round(price * 12 * 0.8) : price;
  };

  // Get the appropriate price ID based on billing interval
  const getPriceId = (product: Product) => {
    // In a real app, you might have separate price IDs for monthly/yearly
    return product.priceId; // This is simplified - adjust as needed
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Choose the perfect plan for your needs
        </p>
        
        {showMonthlyToggle && (
          <div className="mt-6 flex items-center justify-center">
            <span className={`mr-4 ${billingInterval === 'month' ? 'font-bold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={toggleBillingInterval}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              role="switch"
              aria-checked={billingInterval === 'year'}
            >
              <span className="sr-only">Toggle billing interval</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingInterval === 'year' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`ml-4 ${billingInterval === 'year' ? 'font-bold' : 'text-gray-500'}`}>
              Yearly <span className="text-sm text-blue-600">(20% off)</span>
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-8">
        {products.map((product) => {
          const price = getDiscountedPrice(product.price);
          const displayPrice = formatPrice(price, product.currency);
          const monthlyPrice = formatPrice(product.price, product.currency);
          
          return (
            <div
              key={product.id}
              className="flex flex-col rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-8 sm:p-10 sm:pb-6">
                <div className="flex items-center">
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight text-gray-900">
                  {displayPrice}
                  <span className="ml-1 text-2xl font-medium text-gray-500">
                    {billingInterval === 'year' ? '/year' : '/month'}
                  </span>
                </div>
                {billingInterval === 'year' && (
                  <p className="mt-2 text-sm text-gray-500">
                    {monthlyPrice}/month billed annually
                  </p>
                )}
                <p className="mt-6 text-base text-gray-500">
                  {product.description}
                </p>
                <ul className="mt-6 space-y-4">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <svg
                        className="h-6 w-6 flex-shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-base text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
                <div className="mt-8
                ">
                  <div className="rounded-lg">
                    <CheckoutButton
                      priceId={getPriceId(product)}
                      itemName={`${product.name} - ${billingInterval === 'year' ? 'Yearly' : 'Monthly'}`}
                      amount={price}
                      quantity={1}
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="mt-4 text-center text-sm text-gray-500">
                  No setup cost. No hidden fees.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

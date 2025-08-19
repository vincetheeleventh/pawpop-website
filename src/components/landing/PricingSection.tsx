// src/components/landing/PricingSection.tsx

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const PricingSection = () => {
  const { title, options } = landingPageCopy.pricing;

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {options.map((option, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-lg text-center flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{option.name}</h3>
              <p className="text-4xl font-extrabold text-indigo-600 mb-4">{option.price}</p>
              <ul className="text-gray-600 space-y-2 mb-6 flex-grow">
                {option.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <Link href="/order" className="w-full block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {option.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

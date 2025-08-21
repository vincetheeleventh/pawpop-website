// src/components/landing/PricingSection.tsx

import { landingPageCopy } from '@/lib/copy';
import Link from 'next/link';

export const PricingSection = () => {
  const { title, options } = landingPageCopy.pricing;

  return (
    <section id="pricing" className="py-20 bg-base-200">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {options.map((option, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <h3 className="card-title text-2xl justify-center mb-4">{option.name}</h3>
                <p className="text-4xl font-extrabold text-primary mb-4">{option.price}</p>
                <ul className="text-base-content/70 space-y-2 mb-6 flex-grow">
                  {option.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <div className="card-actions justify-center">
                  <Link href="/order" className="btn btn-primary w-full">
                    {option.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

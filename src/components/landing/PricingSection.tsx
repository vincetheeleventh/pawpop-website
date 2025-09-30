// src/components/landing/PricingSection.tsx
'use client';

import { useState } from 'react';
import { getDynamicPricing } from '@/lib/copy';
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';

export const PricingSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pricing = getDynamicPricing();
  const { title, options } = pricing;

  return (
    <>
      <section id="pricing" className="py-20 bg-card-surface">
        <div className="container mx-auto px-6">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center text-text-primary mb-12">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {options.map((option, index) => (
              <div key={index} className="bg-card-surface rounded-xl shadow-xl p-8 border border-gray-100 hover:border-cyclamen transition-all duration-200">
                <div className="text-center">
                  <h3 className="font-playfair text-2xl font-bold text-text-primary mb-4">{option.name}</h3>
                  <p className="text-4xl font-extrabold text-cyclamen mb-4">{option.price}</p>
                  <ul className="text-gray-600 space-y-2 mb-6 flex-grow font-inter">
                    {option.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-cyclamen hover:bg-pink-600 text-white font-fredoka font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg w-full text-center"
                    >
                      {option.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Modal - Email First Flow */}
      <UploadModalEmailFirst 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

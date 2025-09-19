// src/components/landing/ProcessSection.tsx

import { landingPageCopy } from '@/lib/copy';

export const ProcessSection = () => {
  const { process } = landingPageCopy;

  return (
    <section id="process" className="py-16 lg:py-24 bg-atomic-tangerine/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {process.title}
          </h2>
          <p className="font-inter text-xl text-gray-600 max-w-3xl mx-auto">
            {process.subtitle}
          </p>
        </div>
        
        {/* Process Steps - Triptych Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {process.steps.map((step, index) => (
            <div key={index} className="
              bg-card-surface rounded-xl p-8 text-center
              border border-gray-100 hover:border-naples-yellow
              transition-all duration-200 hover:shadow-lg
              group
            ">
              <div className="w-16 h-16 bg-pale-azure rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h3 className="font-playfair text-xl font-bold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="font-inter text-gray-600 mb-4">
                {step.description}
              </p>
              
            </div>
          ))}
        </div>
        
        {/* Quality Guarantee */}
        <div className="mt-16 text-center">
          <div className="
            bg-card-surface rounded-2xl shadow-lg p-8 max-w-2xl mx-auto
            border-2 border-naples-yellow/20
          ">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-atomic-tangerine rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">🎨</span>
              </div>
              <h3 className="font-playfair text-2xl font-bold text-text-primary">
                Our Promise
              </h3>
            </div>
            <p className="font-inter text-gray-600 mb-6">
              We guarantee your transformation will be beautiful! If you are not completely delighted with your Renaissance masterpiece, we will make it right.
            </p>
            <div className="flex justify-center space-x-8 text-sm font-inter text-gray-500">
              <div className="flex items-center">
                <span className="text-mindaro mr-2">✨</span>
                Handcrafted Quality
              </div>
              <div className="flex items-center">
                <span className="text-cyclamen mr-2">💕</span>
                100% Satisfaction
              </div>
              <div className="flex items-center">
                <span className="text-naples-yellow mr-2">🖼️</span>
                Museum Quality
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

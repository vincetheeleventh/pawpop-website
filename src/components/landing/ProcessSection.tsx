// src/components/landing/ProcessSection.tsx

import { landingPageCopy } from '@/lib/copy';

export const ProcessSection = () => {
  const { title, steps } = landingPageCopy.process;

  return (
    <section id="process" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 font-bold text-2xl mx-auto">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// src/components/landing/EmailCaptureSection.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';

export const EmailCaptureSection = () => {
  const { title, subtitle, placeholder, buttonText } = landingPageCopy.emailCapture;

  return (
    <section className="bg-indigo-600 py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-indigo-200">{subtitle}</p>
        <div className="mt-6 max-w-md mx-auto">
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
            <button type="submit" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-md hover:bg-indigo-100 transition-colors">
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

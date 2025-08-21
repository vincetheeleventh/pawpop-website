// src/components/landing/EmailCaptureSection.tsx
'use client';

import { landingPageCopy } from '@/lib/copy';

export const EmailCaptureSection = () => {
  const { title, subtitle, placeholder, buttonText } = landingPageCopy.emailCapture;

  return (
    <section className="bg-primary py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-primary-content/80">{subtitle}</p>
        <div className="mt-6 max-w-md mx-auto">
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder={placeholder}
              className="input input-bordered w-full"
              required
            />
            <button type="submit" className="btn btn-secondary">
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

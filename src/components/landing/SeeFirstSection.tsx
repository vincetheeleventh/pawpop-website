// src/components/landing/SeeFirstSection.tsx
'use client';

import React from 'react';

export const SeeFirstSection = () => {
  return (
    <section className="w-full bg-gradient-to-br from-cyclamen/10 via-pale-azure/10 to-mindaro/10 py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Main Headline */}
        <h2 className="font-arvo text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
          See Your Artwork <span className="text-cyclamen">FREE</span>, Then Decide
        </h2>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
          Most custom art services make you pay first and hope for the best. Not us! 🎨
        </p>

        {/* The Difference */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Other Services */}
            <div className="text-left">
              <div className="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-full font-bold mb-4">
                ❌ Other Services
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 text-xl">•</span>
                  <span>Pay first, hope for the best</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 text-xl">•</span>
                  <span>Wait days to see what you get</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 text-xl">•</span>
                  <span>Stuck with it even if you don't love it</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 text-xl">•</span>
                  <span>Awkward refund requests</span>
                </li>
              </ul>
            </div>

            {/* PawPop */}
            <div className="text-left">
              <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-full font-bold mb-4">
                ✨ PawPop Way
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xl">•</span>
                  <span><strong>Free artwork proof</strong> — see your masterpiece before you buy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xl">•</span>
                  <span>Upload 2 photos, get your proof in 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xl">•</span>
                  <span>Want it on your wall? We'll ship a physical artwork to you.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xl">•</span>
                  <span><strong>Zero payment</strong> until you're 100% happy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-arvo font-bold text-text-primary mb-4">
            Upload 2 photos, get your proof in 24 hours! 🎨
          </p>
          <p className="text-lg text-gray-600">
            No credit card. No commitment. Just upload and see your masterpiece.
          </p>
        </div>
      </div>
    </section>
  );
};

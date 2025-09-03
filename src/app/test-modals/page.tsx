// src/app/test-modals/page.tsx
'use client';

import { useState } from 'react';
import { PurchaseModalDigitalFirst } from '@/components/modals/PurchaseModalDigitalFirst';
import { PurchaseModalEqualTiers } from '@/components/modals/PurchaseModalEqualTiers';
import { PurchaseModalPhysicalFirst } from '@/components/modals/PurchaseModalPhysicalFirst';

const mockArtwork = {
  id: 'test-artwork-123',
  generated_image_url: '/images/flux-test-output.png',
  customer_name: 'Sarah',
  customer_email: 'sarah@example.com',
  pet_name: 'Bella'
};

export default function TestModalsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mona-cream to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-charcoal-frame text-center mb-8">
          A/B Test Modal Variants
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Digital-First Modal */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-charcoal-frame">Digital-First</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Digital download as hero CTA with physical options as secondary
            </p>
            <button
              onClick={() => setActiveModal('digital-first')}
              className="btn btn-primary w-full"
            >
              View Modal
            </button>
          </div>

          {/* Equal Tiers Modal */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-charcoal-frame">Equal Tiers</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Classic 3-column pricing table with "Best Value" guidance
            </p>
            <button
              onClick={() => setActiveModal('equal-tiers')}
              className="btn btn-primary w-full"
            >
              View Modal
            </button>
          </div>

          {/* Physical-First Modal */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-charcoal-frame">Physical-First</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Physical products as main CTAs with digital as "free bonus"
            </p>
            <button
              onClick={() => setActiveModal('physical-first')}
              className="btn btn-primary w-full"
            >
              View Modal
            </button>
          </div>
        </div>

        {/* Test Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">A/B Testing Strategy</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Digital-First:</strong> Tests if customers prefer instant gratification + lowest price</li>
            <li><strong>Equal Tiers:</strong> Tests neutral presentation with guided choice architecture</li>
            <li><strong>Physical-First:</strong> Tests premium gift positioning with digital as added value</li>
          </ul>
        </div>
      </div>

      {/* Modal Variants */}
      <PurchaseModalDigitalFirst
        isOpen={activeModal === 'digital-first'}
        onClose={() => setActiveModal(null)}
        artwork={mockArtwork}
      />

      <PurchaseModalEqualTiers
        isOpen={activeModal === 'equal-tiers'}
        onClose={() => setActiveModal(null)}
        artwork={mockArtwork}
      />

      <PurchaseModalPhysicalFirst
        isOpen={activeModal === 'physical-first'}
        onClose={() => setActiveModal(null)}
        artwork={mockArtwork}
      />
    </div>
  );
}

// src/components/order/OrderForm.tsx
"use client";

import { useState } from 'react';
import { ImageUploader } from '@/components/common/ImageUploader';
import { ProductSelection } from '@/components/landing/ProductSelection';

const STEPS = {
  UPLOAD: 1,
  SELECT_PRODUCT: 2,
  CHECKOUT: 3,
};

export const OrderForm = () => {
  const [step, setStep] = useState(STEPS.UPLOAD);

  const renderStep = () => {
    switch (step) {
      case STEPS.UPLOAD:
        return <ImageUploader />;
      case STEPS.SELECT_PRODUCT:
        return <ProductSelection />;
      case STEPS.CHECKOUT:
        return <div>Checkout details will go here.</div>;
      default:
        return <ImageUploader />;
    }
  };

  return (
    <div>
      {renderStep()}
      <div className="flex justify-center gap-4 mt-8">
        {step > STEPS.UPLOAD && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2 border rounded">Back</button>
        )}
        {step < STEPS.CHECKOUT && (
          <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-blue-600 text-white rounded">Next</button>
        )}
      </div>
    </div>
  );
};

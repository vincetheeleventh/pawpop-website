'use client';

import { useState } from 'react';
import { UploadModal } from '@/components/forms/UploadModal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UploadPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    // Redirect to home page after modal closes
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-site-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back to Home Link */}
          <Link 
            href="/" 
            className="inline-flex items-center text-text-primary/70 hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-3xl font-arvo font-bold text-text-primary text-center mb-4">
            Upload Your Pet's Photo
          </h1>
          <p className="text-lg text-text-primary/80 text-center mb-8">
            Transform your pet's photo into a beautiful custom portrait
          </p>
          
          {/* CTA Button to open modal */}
          {!isModalOpen && (
            <div className="text-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  inline-block w-full max-w-xs
                  bg-atomic-tangerine hover:bg-orange-600
                  text-white font-fredoka font-bold
                  py-4 px-8 text-xl rounded-full
                  transition-all duration-200
                  transform hover:scale-105 shadow-xl hover:shadow-2xl
                  min-h-[56px] touch-manipulation
                "
              >
                Start Upload
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
      />
    </div>
  );
}

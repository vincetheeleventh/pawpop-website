'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, AlertCircle, Check } from 'lucide-react';
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';

export default function DeferredUploadPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid upload link');
      setLoading(false);
      return;
    }

    // Fetch artwork by upload token
    const fetchArtwork = async () => {
      try {
        const response = await fetch(`/api/artwork/by-upload-token?token=${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load artwork');
        }

        const data = await response.json();
        setArtwork(data.artwork);

        // Check if already completed
        if (data.artwork.generation_step !== 'pending') {
          setError('This upload link has already been used. Check your email for your artwork link!');
        }

      } catch (err) {
        console.error('Error fetching artwork:', err);
        setError(err instanceof Error ? err.message : 'Failed to load upload page');
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-site-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-atomic-tangerine/30 border-t-atomic-tangerine rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your upload page...</p>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-site-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-arvo font-bold text-text-primary mb-2">
            Oops! Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'This upload link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka py-3 px-6 rounded-xl transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-site-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-atomic-tangerine/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-10 h-10 text-atomic-tangerine" />
          </div>
          <h1 className="text-3xl font-arvo font-bold text-text-primary mb-3">
            Welcome Back, {artwork.customer_name}!
          </h1>
          <p className="text-lg text-gray-600">
            Ready to create your Renaissance masterpiece? Let's upload your photos!
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-naples-yellow/10 border border-naples-yellow/30 rounded-xl p-6">
            <h3 className="font-arvo font-bold text-lg text-text-primary mb-3">
              📸 What You'll Need:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Pet Mom Photo:</strong> A clear photo of the pet mom's face</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Pet Photo:</strong> A photo of their beloved pet</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>3 Minutes:</strong> That's all it takes to create magic!</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-xl py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-6 h-6" />
            Upload Photos Now
          </button>

          <p className="text-sm text-center text-gray-500">
            Your email: {artwork.customer_email}
          </p>
        </div>
      </div>

      {/* Upload Modal - Pre-filled with customer info */}
      {showUploadModal && artwork && (
        <UploadModalEmailFirst
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          prefillData={{
            artworkId: artwork.id,
            customerName: artwork.customer_name,
            customerEmail: artwork.customer_email,
            skipEmailCapture: true
          }}
        />
      )}
    </div>
  );
}

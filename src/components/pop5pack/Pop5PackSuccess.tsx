'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Pop5PackSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/pop5pack/verify-session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            setEmail(data.email);
          }
        })
        .catch((err) => {
          console.error('Failed to verify session:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-site-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyclamen mx-auto mb-4" />
          <p className="font-geist text-text-primary">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-site-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card-surface rounded-2xl p-8 shadow-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-arvo text-4xl font-bold text-text-primary mb-4">
            🎉 Payment Successful!
          </h1>
          
          <p className="font-geist text-xl text-text-primary/70 mb-8">
            Your Pop 5-Pack is being generated right now
          </p>

          <div className="bg-gradient-to-r from-pale-azure/10 to-cyclamen/10 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-arvo text-2xl font-bold text-text-primary mb-4 text-center">
              What Happens Next?
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyclamen text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-geist font-semibold text-text-primary mb-1">
                    We're Generating Your Images
                  </h3>
                  <p className="font-geist text-sm text-text-primary/70">
                    Our AI is creating high-resolution, watermark-free versions of all 4 parody styles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyclamen text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-geist font-semibold text-text-primary mb-1">
                    Check Your Email
                  </h3>
                  <p className="font-geist text-sm text-text-primary/70">
                    {email ? (
                      <>
                        We'll send download links to <strong>{email}</strong> within 5-10 minutes.
                      </>
                    ) : (
                      <>You'll receive download links within 5-10 minutes.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyclamen text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-geist font-semibold text-text-primary mb-1">
                    Download & Enjoy!
                  </h3>
                  <p className="font-geist text-sm text-text-primary/70">
                    Click the links in your email to download all 4 high-resolution images.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-site-bg rounded-xl p-6 mb-8">
            <h3 className="font-arvo text-xl font-bold text-text-primary mb-4">
              Your Complete Pack Includes:
            </h3>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪄</span>
                <span className="font-geist text-sm text-text-primary">Wizarding World</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦈</span>
                <span className="font-geist text-sm text-text-primary">Jaws</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎩</span>
                <span className="font-geist text-sm text-text-primary">The Godfather</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎤</span>
                <span className="font-geist text-sm text-text-primary">MJ Thriller</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-text-primary/10">
              <ul className="space-y-2 font-geist text-sm text-text-primary/70">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>2048x2048px high-resolution</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>No watermarks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Ready for social media & printing</span>
                </li>
              </ul>
            </div>
          </div>

          <Link
            href="/pop5pack"
            className="inline-block bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Create Another Pack
          </Link>

          <div className="mt-8 pt-8 border-t border-text-primary/10">
            <p className="font-geist text-sm text-text-primary/60">
              Questions? Email us at{' '}
              <a href="mailto:pawpopart@gmail.com" className="text-cyclamen hover:underline">
                pawpopart@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="font-geist text-sm text-text-primary/50">
            💯 100% Satisfaction Guarantee - Love it or get your money back
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

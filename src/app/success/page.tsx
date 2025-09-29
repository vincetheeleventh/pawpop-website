'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Clock, Mail, ArrowRight } from 'lucide-react';
import { useImageTracking } from '@/lib/image-tracking';

interface OrderData {
  orderNumber: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  productType: string;
  productSize: string;
  price: string;
  orderStatus: string;
  estimatedDelivery: string;
  createdAt: string;
  artwork?: {
    id: string;
    petName?: string;
    previewImage?: string;
    accessToken?: string;
  };
  shippingAddress?: any;
  printifyOrderId?: string;
  printifyStatus?: string;
}

function SuccessContent() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize image tracking
  const { attachToRef, detach } = useImageTracking({
    imageType: 'artwork_preview',
    orderId: orderData?.orderNumber,
    customerName: orderData?.customerName,
    petName: orderData?.artwork?.petName,
    productType: orderData?.productType,
    customerEmail: orderData?.customerEmail
  });
  
  useEffect(() => {
    const fetchOrderData = async (retryCount = 0) => {
      const maxRetries = 5;
      const retryDelay = Math.min(2000 * Math.pow(1.5, retryCount), 10000); // Exponential backoff, max 10s
      
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Payment successful for session:', sessionId);
        
        // Fetch order details from our API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`/api/orders/session/${sessionId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            if (retryCount < maxRetries) {
              // Order might not be created yet by webhook, retry after delay
              console.log(`Order not found, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
              setTimeout(() => fetchOrderData(retryCount + 1), retryDelay);
              return;
            } else {
              // FINAL RETRY: Trigger emergency order creation
              console.log('🚨 Final retry - triggering emergency order creation...');
              try {
                const reconcileResponse = await fetch('/api/orders/reconcile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionIds: [sessionId] })
                });
                
                if (reconcileResponse.ok) {
                  console.log('✅ Emergency order creation attempted, retrying fetch...');
                  // Wait a moment for the order to be created, then try one more time
                  setTimeout(() => {
                    fetch(`/api/orders/session/${sessionId}`)
                      .then(res => res.ok ? res.json() : Promise.reject())
                      .then(data => {
                        console.log('✅ Order found after emergency creation!');
                        setOrderData(data);
                      })
                      .catch(() => {
                        console.log('❌ Emergency order creation failed');
                        setError('Order not found - please contact support with your session ID: ' + sessionId);
                      })
                      .finally(() => setLoading(false));
                  }, 2000);
                  return;
                } else {
                  console.log('❌ Emergency order creation API failed');
                }
              } catch (emergencyError) {
                console.error('❌ Emergency order creation error:', emergencyError);
              }
            }
          }
          throw new Error('Failed to fetch order details');
        }
        
        const data = await response.json();
        setOrderData(data);
        
        // Simulate webhook behavior - send order confirmation email
        const sendOrderConfirmation = async () => {
          try {
            console.log('🔄 Triggering order confirmation email...');
            const webhookResponse = await fetch('/api/webhook/simulate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                session_id: sessionId,
                type: 'checkout.session.completed'
              })
            });
            
            if (webhookResponse.ok) {
              console.log('✅ Order confirmation email triggered successfully');
            } else {
              console.warn('⚠️ Failed to trigger order confirmation email');
            }
          } catch (error) {
            console.error('❌ Error triggering order confirmation:', error);
          }
        };
        
        // Send confirmation email after successful payment
        sendOrderConfirmation();
        
        // Track conversion if gtag is available
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'purchase', {
            transaction_id: sessionId,
            value: parseFloat(data.price.replace('$', '')),
            currency: 'USD'
          });
        }
        
      } catch (err) {
        console.error('Error fetching order data:', err);
        
        // FAILURE CONDITION: Handle different error types
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // Timeout occurred
            if (retryCount < maxRetries) {
              console.log(`Request timeout, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
              setTimeout(() => fetchOrderData(retryCount + 1), retryDelay);
              return;
            } else {
              setError('Request timeout - please refresh the page or contact support');
            }
          } else if (err.message.includes('fetch')) {
            // Network error
            if (retryCount < maxRetries) {
              console.log(`Network error, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
              setTimeout(() => fetchOrderData(retryCount + 1), retryDelay);
              return;
            } else {
              setError('Network error - please check your connection and refresh');
            }
          } else {
            setError('Failed to load order details');
          }
        } else {
          setError('Failed to load order details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();

    // Cleanup image tracking on unmount
    return () => {
      detach();
    };
  }, [sessionId, detach]);

  if (loading) {
    return (
      <div className="min-h-screen bg-site-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyclamen mx-auto"></div>
          <p className="mt-4 text-lg text-text-primary">Loading your order details...</p>
          <p className="mt-2 text-sm text-text-primary/70">Processing your payment and creating your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-site-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">⚠️</div>
          <h1 className="text-2xl font-arvo font-bold text-text-primary mb-4">
            Unable to Load Order Details
          </h1>
          <p className="text-text-primary mb-8">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-cyclamen hover:bg-cyclamen/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyclamen transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-site-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
          <h1 className="text-4xl font-arvo font-bold text-text-primary sm:text-5xl mb-4">
            Order Confirmed! 🎉
          </h1>
          <p className="text-xl text-text-primary/80 max-w-2xl mx-auto">
            Thank you {orderData.customerName}! Your {orderData.productType.toLowerCase()} order has been processed successfully.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-card-surface shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-6 bg-gradient-to-r from-cyclamen/10 to-atomic-tangerine/10">
                <h3 className="text-xl font-arvo font-bold text-text-primary flex items-center">
                  <Package className="h-6 w-6 mr-3 text-cyclamen" />
                  Order Details
                </h3>
                <p className="mt-2 text-text-primary/70">
                  Your order is being prepared with care
                </p>
              </div>
              
              <div className="px-6 py-6">
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Order Number</dt>
                    <dd className="mt-1 text-lg font-bold text-text-primary">
                      {orderData.orderNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Date</dt>
                    <dd className="mt-1 text-lg text-text-primary">
                      {new Date(orderData.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Product</dt>
                    <dd className="mt-1 text-lg text-text-primary">
                      {orderData.productType} - {orderData.productSize}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Total</dt>
                    <dd className="mt-1 text-lg font-bold text-text-primary">
                      {orderData.price}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Status</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Payment Completed
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-primary/70">Email</dt>
                    <dd className="mt-1 text-lg text-text-primary">
                      {orderData.customerEmail}
                    </dd>
                  </div>
                </dl>

                {/* Pet Name if available */}
                {orderData.artwork?.petName && (
                  <div className="mt-6 p-4 bg-naples-yellow/20 rounded-xl">
                    <p className="text-text-primary">
                      <span className="font-medium">Pet's Name:</span> {orderData.artwork.petName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Next Steps & Timeline */}
          <div className="space-y-6">
            {/* Delivery Timeline */}
            <div className="bg-card-surface shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-pale-azure/10 to-mindaro/10">
                <h3 className="text-lg font-arvo font-bold text-text-primary flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-pale-azure" />
                  Delivery Timeline
                </h3>
              </div>
              <div className="px-6 py-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyclamen mb-2">
                    {orderData.estimatedDelivery}
                  </div>
                  <p className="text-sm text-text-primary/70">
                    {orderData.productType === 'Digital Download' 
                      ? 'Your digital files are ready!'
                      : 'Estimated delivery date'
                    }
                  </p>
                </div>
                
                {orderData.productType !== 'Digital Download' && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-text-primary">Order confirmed</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-cyclamen rounded-full mr-3"></div>
                      <span className="text-text-primary">In production</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-text-primary/50">Shipped</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-text-primary/50">Delivered</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="bg-card-surface shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-naples-yellow/10 to-mindaro/10">
                <h3 className="text-lg font-arvo font-bold text-text-primary flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-naples-yellow" />
                  Email Confirmation
                </h3>
              </div>
              <div className="px-6 py-6">
                <p className="text-sm text-text-primary/70 mb-4">
                  We've sent a confirmation email to:
                </p>
                <p className="font-medium text-text-primary mb-4">
                  {orderData.customerEmail}
                </p>
                <p className="text-xs text-text-primary/60">
                  Check your spam folder if you don't see it in your inbox.
                </p>
              </div>
            </div>

            {/* Artwork Preview */}
            {orderData.artwork?.previewImage && (
              <div className="bg-card-surface shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4">
                  <h3 className="text-lg font-arvo font-bold text-text-primary mb-4">
                    Your Masterpiece
                  </h3>
                  <div className="aspect-square rounded-xl overflow-hidden mb-4">
                    <img 
                      ref={(el) => {
                        if (el) attachToRef(el);
                      }}
                      src={orderData.artwork.previewImage} 
                      alt="Your custom artwork"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => {
                        // Track image view/interaction
                        if (typeof window !== 'undefined' && window.plausible) {
                          window.plausible('Image Viewed', {
                            props: {
                              image_type: 'artwork_preview',
                              order_id: orderData.orderNumber,
                              product_type: orderData.productType
                            }
                          });
                        }
                        // Open image in new tab for viewing
                        if (orderData.artwork?.previewImage) {
                          window.open(orderData.artwork.previewImage, '_blank');
                        }
                      }}
                    />
                  </div>
                  {orderData.artwork.accessToken && (
                    <Link
                      href={`/artwork/${orderData.artwork.accessToken}`}
                      className="inline-flex items-center text-sm text-cyclamen hover:text-cyclamen/80 font-medium"
                    >
                      View Full Artwork
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-cyclamen hover:bg-cyclamen/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyclamen transition-colors"
          >
            Create Another Masterpiece
          </Link>
          <a
            href={`mailto:pawpopart@gmail.com?subject=Order ${orderData.orderNumber} - Question`}
            className="inline-flex items-center px-8 py-3 border border-cyclamen text-base font-medium rounded-xl text-cyclamen bg-transparent hover:bg-cyclamen/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyclamen transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Help Section */}
        <div className="mt-16 border-t border-naples-yellow/30 pt-12 text-center">
          <h2 className="text-2xl font-arvo font-bold text-text-primary mb-4">
            Need Help?
          </h2>
          <p className="text-text-primary/70 max-w-2xl mx-auto mb-6">
            Have questions about your order or need assistance? Our support team is here to help make sure your experience is perfect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-text-primary/60">
            <span>📧 pawpopart@gmail.com</span>
            <span className="hidden sm:inline">•</span>
            <span>📞 +1 604 499 7660</span>
            <span className="hidden sm:inline">•</span>
            <span>🕒 Response within 24 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-site-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyclamen mx-auto"></div>
          <p className="mt-4 text-lg text-text-primary">Loading your order details...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

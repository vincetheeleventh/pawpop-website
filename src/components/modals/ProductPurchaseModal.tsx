'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, Truck } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

interface Mockup {
  type: string
  title: string
  description: string
  mockupUrl: string
  productId: string
  size: string
}

interface ShippingOption {
  id: number
  name: string
  cost: number
  estimatedDays: string
  isDefault?: boolean
}

interface ProductPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  productType: string
  mockups: Mockup[]
  artwork: {
    id: string
    pet_name?: string
    customer_name: string
    customer_email?: string
    generated_image_url?: string
    generated_images?: {
      artwork_preview?: string
      artwork_full_res?: string
    }
  }
  onProductClick?: (productType: string, mockups: Mockup[]) => void
}

const PRODUCT_PRICING = {
  art_print: {
    '12x18': { price: 49, originalPrice: 59 },
    '16x24': { price: 69, originalPrice: 79 },
    '20x30': { price: 89, originalPrice: 99 }
  },
  canvas_stretched: {
    '12x18': { price: 89, originalPrice: 109 },
    '16x24': { price: 129, originalPrice: 149 },
    '20x30': { price: 169, originalPrice: 199 }
  },
  canvas_framed: {
    '12x18': { price: 149, originalPrice: 179 },
    '16x24': { price: 199, originalPrice: 229 },
    '20x30': { price: 249, originalPrice: 289 }
  }
}

// Create fallback mockups for all sizes when real mockups aren't available
const createFallbackMockups = (productType: string, artworkUrl: string): Mockup[] => {
  const sizes = ['12x18', '16x24', '20x30']
  return sizes.map(size => ({
    type: productType,
    title: productType === 'art_print' ? `Fine Art Print (${size}")` : 
           productType === 'canvas_stretched' ? `Canvas Stretched (${size}")` : 
           `Canvas Framed (${size}")`,
    description: productType === 'art_print' ? 'Museum-quality fine art paper (285 g/m²)' :
                productType === 'canvas_stretched' ? 'Gallery-wrapped, ready to hang' :
                'Professional framing included',
    mockupUrl: artworkUrl,
    productId: `fallback-${productType}-${size}`,
    size: size
  }))
}

// Initialize Stripe
let stripePromise: any;
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

export default function ProductPurchaseModal({ 
  isOpen, 
  onClose, 
  productType, 
  mockups, 
  artwork,
  onProductClick 
}: ProductPurchaseModalProps) {
  const [selectedSize, setSelectedSize] = useState('20x30')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)

  // Fetch shipping options when modal opens
  useEffect(() => {
    if (isOpen && productType !== 'digital') {
      fetchShippingOptions()
    }
  }, [isOpen, productType])

  const fetchShippingOptions = async () => {
    setLoadingShipping(true)
    try {
      const response = await fetch(`/api/shipping/methods?productType=${productType}&countryCode=US`)
      if (response.ok) {
        const data = await response.json()
        setShippingOptions(data.shippingMethods)
        
        // Auto-select default shipping method
        const defaultOption = data.shippingMethods.find((option: ShippingOption) => option.isDefault)
        if (defaultOption) {
          setSelectedShipping(defaultOption.id)
        }
      } else {
        console.error('Failed to fetch shipping options')
        // Set fallback options
        setShippingOptions([
          { id: 1, name: 'Standard Shipping', cost: 0, estimatedDays: '5-7 business days', isDefault: true }
        ])
        setSelectedShipping(1)
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error)
      // Set fallback options
      setShippingOptions([
        { id: 1, name: 'Standard Shipping', cost: 0, estimatedDays: '5-7 business days', isDefault: true }
      ])
      setSelectedShipping(1)
    } finally {
      setLoadingShipping(false)
    }
  }

  if (!isOpen) return null

  const productTitle = productType === 'art_print' ? 'Fine Art Print' : 
                      productType === 'canvas_stretched' ? 'Canvas Stretched' : 'Canvas Framed'
  
  const productDescription = productType === 'art_print' ? 'Museum-quality fine art paper (285 g/m²) with archival inks' :
                            productType === 'canvas_stretched' ? 'Gallery-wrapped canvas, ready to hang' : 
                            'Professional framing with museum-quality canvas'

  // Get the artwork image URL from new or legacy schema
  const artworkImageUrl = artwork.generated_images?.artwork_preview || 
                          artwork.generated_images?.artwork_full_res || 
                          artwork.generated_image_url || ''

  // Use provided mockups or create fallbacks
  const allMockups = mockups.length > 0 ? mockups : createFallbackMockups(productType, artworkImageUrl)
  const selectedMockup = allMockups.find(m => m.size === selectedSize) || allMockups[0]
  const pricing = PRODUCT_PRICING[productType as keyof typeof PRODUCT_PRICING] || PRODUCT_PRICING.canvas_stretched

  const handlePurchase = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate required data
      if (!artwork.customer_email) {
        throw new Error('Customer email is required for checkout')
      }

      const response = await fetch('/api/checkout/artwork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: artwork.id,
          productType,
          size: selectedSize,
          customerEmail: artwork.customer_email,
          customerName: artwork.customer_name,
          petName: artwork.pet_name,
          imageUrl: artworkImageUrl,
          frameUpgrade: false,
          quantity: quantity,
          shippingMethodId: selectedShipping
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.sessionId) {
        throw new Error('Invalid response from server: missing sessionId')
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred during checkout')
      console.error('Checkout error:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleUpsell = () => {
    if (productType === 'canvas_stretched') {
      // Directly switch to framed canvas modal without confirmation
      onClose()
      
      // Trigger parent component to open framed canvas modal
      if (onProductClick) {
        const framedMockups = createFallbackMockups('canvas_framed', artworkImageUrl)
        onProductClick('canvas_framed', framedMockups)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-playfair font-bold text-charcoal-frame">
            {productTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Mockup Display */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-6">
                {selectedMockup ? (
                  <img 
                    src={selectedMockup.mockupUrl}
                    alt={`${productTitle} - ${selectedSize}`}
                    className="w-full h-64 object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-gray-500">Mockup preview</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center">
                {productDescription}
              </p>
            </div>

            {/* Right: Size Selection & Purchase */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-frame mb-4">
                  Choose Your Size
                </h3>
                <div className="space-y-3">
                  {Object.entries(pricing).map(([size, priceInfo]) => (
                    <div
                      key={size}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedSize === size 
                          ? 'border-mona-gold bg-mona-gold/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{size.replace('x', '" x ')}"</p>
                          <p className="text-sm text-gray-600">
                            {size === '12x18' ? 'Perfect for desks & shelves' :
                             size === '16x24' ? 'Great for walls & galleries' :
                             'Statement piece for any room'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${priceInfo.price}</p>
                          <p className="text-sm text-gray-500 line-through">
                            ${priceInfo.originalPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantity:</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Shipping Selection */}
              {productType !== 'digital' && (
                <div>
                  {loadingShipping ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyclamen"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading shipping...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <Truck className="inline w-4 h-4 mr-1" />
                          Standard shipping is FREE
                        </span>
                        {shippingOptions.find(opt => opt.cost > 0) && (
                          <button
                            onClick={() => {
                              const expressOption = shippingOptions.find(opt => opt.cost > 0);
                              if (expressOption) {
                                setSelectedShipping(selectedShipping === expressOption.id ? 
                                  shippingOptions.find(opt => opt.cost === 0)?.id || 1 : 
                                  expressOption.id
                                );
                              }
                            }}
                            className={`text-sm px-3 py-1 rounded transition-colors ${
                              selectedShipping === shippingOptions.find(opt => opt.cost > 0)?.id
                                ? 'bg-cyclamen text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Express +$20
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upsell for Canvas Stretched */}
              {productType === 'canvas_stretched' && (
                <div className="bg-mona-gold/10 border border-mona-gold/30 rounded-lg p-4">
                  <h4 className="font-semibold text-charcoal-frame mb-2">
                    ✨ Upgrade to Framed Canvas
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add professional framing for a museum-quality finish. Perfect for gifting!
                  </p>
                  <button
                    onClick={handleUpsell}
                    className="text-sm text-mona-gold hover:text-mona-gold/80 font-medium"
                  >
                    See Framed Options →
                  </button>
                </div>
              )}

              {/* Purchase Button */}
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className={`w-full btn btn-primary btn-lg text-lg py-4 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 
                   `Buy Now - $${((pricing[selectedSize as keyof typeof pricing]?.price || 0) * quantity).toFixed(0)}`}
                </button>
                
                <div className="text-center text-sm text-gray-500 space-y-1">
                  {productType === 'digital' ? (
                    <>
                      <p>✓ Instant digital download</p>
                      <p>✓ High-resolution files included</p>
                    </>
                  ) : (
                    <>
                      <p>✓ {shippingOptions.find(opt => opt.id === selectedShipping)?.cost === 0 ? 'Free shipping' : 'Shipping calculated at checkout'}</p>
                      <p>✓ Estimated delivery: {shippingOptions.find(opt => opt.id === selectedShipping)?.estimatedDays || '5-7 business days'}</p>
                    </>
                  )}
                  <p>✓ 30-day satisfaction guarantee</p>
                  <p>✓ Handcrafted with premium materials</p>
                  {productType !== 'digital' && (
                    <p className="text-xs text-gray-400 mt-2">
                      Shipping address will be collected at checkout
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

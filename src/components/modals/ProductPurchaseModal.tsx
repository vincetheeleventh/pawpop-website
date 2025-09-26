'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, Truck, Star } from 'lucide-react'
import { redirectToCheckout } from '@/lib/stripe-simple'
import { getDynamicPricing } from '@/lib/copy'
import usePlausibleTracking from '@/hooks/usePlausibleTracking'

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

// Dynamic pricing based on A/B test variants - removed static pricing
// Pricing is now handled by getCurrentPrice() function using Plausible variants

// Create fallback mockups for all sizes when real mockups aren't available
const createFallbackMockups = (productType: string, artworkUrl: string): Mockup[] => {
  // Use different sizes based on product type to match PRODUCT_B.md
  const sizes = productType === 'art_print' 
    ? ['12x18', '18x24', '20x30']  // Art prints: 12×18, 18×24, 20×30
    : ['12x18', '16x24', '20x30']  // Canvas: 12×18, 16×24, 20×30
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

// Using enhanced Stripe integration with ad-blocker fallback

export default function ProductPurchaseModal({ 
  isOpen, 
  onClose, 
  productType, 
  mockups, 
  artwork,
  onProductClick 
}: ProductPurchaseModalProps) {
  const [selectedSize, setSelectedSize] = useState(productType === 'digital' ? 'digital' : '20x30')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Plausible tracking and dynamic pricing
  const { trackFunnel, trackInteraction, trackPriceExposure, getPriceConfig } = usePlausibleTracking()
  const dynamicPricing = getDynamicPricing()
  const priceConfig = getPriceConfig()

  // Track modal opening and price exposure
  useEffect(() => {
    if (isOpen) {
      trackFunnel.purchaseModalOpened(productType)
      trackInteraction.modalOpen('Product Purchase Modal')
      
      // Track price variant exposure
      const currentPrice = getCurrentPrice()
      trackPriceExposure('Purchase Modal', productType, currentPrice)
    }
  }, [isOpen, productType, trackFunnel, trackInteraction, trackPriceExposure])

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

  // Get current price based on A/B test variant and selected size
  const getCurrentPrice = () => {
    if (productType === 'digital') {
      return priceConfig.digital
    } else if (productType === 'art_print') {
      // Art print pricing by size
      switch (selectedSize) {
        case '12x18': return priceConfig.print
        case '18x24': return priceConfig.printMid
        case '20x30': return priceConfig.printLarge
        default: return priceConfig.print
      }
    } else if (productType === 'canvas_stretched') {
      // Canvas stretched pricing by size
      switch (selectedSize) {
        case '12x18': return priceConfig.canvas
        case '16x24': return priceConfig.canvasMid
        case '20x30': return priceConfig.canvasLarge
        default: return priceConfig.canvas
      }
    } else if (productType === 'canvas_framed') {
      // Canvas framed pricing by size
      switch (selectedSize) {
        case '12x18': return priceConfig.canvasFramed
        case '16x24': return priceConfig.canvasFramedMid
        case '20x30': return priceConfig.canvasFramedLarge
        default: return priceConfig.canvasFramed
      }
    }
    return priceConfig.digital // fallback
  }

  if (!isOpen) return null

  const productTitle = productType === 'digital' ? 'Digital Download' :
                      productType === 'art_print' ? 'Fine Art Print' : 
                      productType === 'canvas_stretched' ? 'Canvas Stretched' : 'Canvas Framed'
  
  const productDescription = productType === 'digital' ? 'High-resolution digital file to enhance and print locally - add your own artistic touches!' :
                            productType === 'art_print' ? 'Museum-quality fine art paper (285 g/m²) with archival inks' :
                            productType === 'canvas_stretched' ? 'Gallery-wrapped canvas, ready to hang' : 
                            'Professional framing with museum-quality canvas'

  // Get the artwork image URL from new or legacy schema
  const artworkImageUrl = artwork.generated_images?.artwork_preview || 
                          artwork.generated_images?.artwork_full_res || 
                          artwork.generated_image_url || ''

  // Use provided mockups or create fallbacks
  const allMockups = mockups.length > 0 ? mockups : createFallbackMockups(productType, artworkImageUrl)
  const selectedMockup = allMockups.find(m => m.size === selectedSize) || allMockups[0]
  
  // Create pricing for all available sizes
  const getAllSizesPricing = () => {
    if (productType === 'digital') {
      const digitalPrice = priceConfig.digital
      return { digital: { price: digitalPrice, originalPrice: digitalPrice + 10 } }
    }
    
    // Get all available sizes for the product type
    const sizes = productType === 'art_print' 
      ? ['12x18', '18x24', '20x30']  // Art prints: 12×18, 18×24, 20×30
      : ['12x18', '16x24', '20x30']  // Canvas: 12×18, 16×24, 20×30
    
    const pricing: Record<string, { price: number; originalPrice: number }> = {}
    
    sizes.forEach(size => {
      let price = priceConfig.digital // fallback
      
      if (productType === 'art_print') {
        switch (size) {
          case '12x18': price = priceConfig.print; break
          case '18x24': price = priceConfig.printMid; break
          case '20x30': price = priceConfig.printLarge; break
        }
      } else if (productType === 'canvas_stretched') {
        switch (size) {
          case '12x18': price = priceConfig.canvas; break
          case '16x24': price = priceConfig.canvasMid; break
          case '20x30': price = priceConfig.canvasLarge; break
        }
      } else if (productType === 'canvas_framed') {
        switch (size) {
          case '12x18': price = priceConfig.canvasFramed; break
          case '16x24': price = priceConfig.canvasFramedMid; break
          case '20x30': price = priceConfig.canvasFramedLarge; break
        }
      }
      
      pricing[size] = { price, originalPrice: price + 20 }
    })
    
    return pricing
  }

  const pricing = getAllSizesPricing()
  const currentPrice = getCurrentPrice()

  const handlePurchase = async () => {
    setLoading(true)
    setError(null)

    // Track checkout initiation
    trackFunnel.checkoutInitiated(productType, currentPrice, quantity)
    trackInteraction.buttonClick('Buy Now', 'Purchase Modal')

    try {
      // Validate required data
      if (!artwork.customer_email) {
        throw new Error('Customer email is required for checkout')
      }

      console.log('🔍 About to create Stripe checkout session...');

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
          quantity: productType === 'digital' ? 1 : quantity,
          shippingMethodId: productType === 'digital' ? null : selectedShipping,
          testMode: false // Always use live mode
        }),
      })

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not ok:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Checkout API response:', data);

      // Handle test mode responses
      if (data.testMode) {
        console.log('🧪 Test mode response received:', data.message);
        setError('Demo mode: ' + (data.message || 'Payment system in test mode'));
        setLoading(false);
        return;
      }

      if (!data.sessionId) {
        console.error('❌ No session ID in response:', data);
        throw new Error('Invalid response from server: missing sessionId')
      }

      console.log('🎫 Session ID received:', data.sessionId);

      // Use simple, correct Stripe integration
      console.log('💳 Redirecting to Stripe checkout...');
      
      const { error: stripeError } = await redirectToCheckout(data.sessionId);

      if (stripeError) {
        console.error('❌ Stripe redirect error:', stripeError);
        
        // Handle specific error types
        if (stripeError.message?.includes('test mode') && stripeError.message?.includes('live mode')) {
          setError('Payment system configuration error. Please try again or contact support.');
        } else {
          setError(stripeError.message || 'Payment failed. Please try again.');
        }

        setLoading(false);
        return;
      }

      // If we get here, the redirect should have happened
      console.log('🚀 Redirect initiated successfully');
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
      <div className="bg-white rounded-lg max-w-sm sm:max-w-4xl md:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-arvo font-bold text-text-primary">
            {productTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
          {/* Left: Image Display */}
          <div className="bg-site-bg/30 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-sm md:max-w-md">
              {selectedMockup ? (
                <img 
                  src={selectedMockup.mockupUrl}
                  alt={`${productTitle} - ${selectedSize}`}
                  className="w-full h-auto object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 font-geist">Mockup preview</p>
                </div>
              )}
              <p className="text-sm text-gray-600 text-center mt-4 font-geist">
                {productDescription}
              </p>
            </div>
          </div>

          {/* Right: Size Selection & Purchase */}
          <div className="p-4 md:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                {productType === 'digital' ? (
                  <>
                    <h3 className="text-xl font-arvo font-bold text-text-primary mb-6">
                      Digital Download
                    </h3>
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 line-through font-geist">
                          ${currentPrice + 10}
                        </p>
                        <p className="font-arvo font-bold text-3xl text-cyclamen">
                          ${currentPrice}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-arvo font-bold text-text-primary mb-3">
                          What You Get:
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600 font-geist">
                          <p>✓ High-resolution PNG file (300 DPI)</p>
                          <p>✓ Print-ready up to 20" × 30"</p>
                          <p>✓ Add fine details to make it even more beautiful</p>
                          <p>✓ Make every strand of fur pop with painterly strokes</p>
                          <p>✓ Perfect for custom framing and personal touches</p>
                          <p>✓ Instant download after purchase</p>
                          <p>✓ Lifetime access to your masterpiece</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-arvo font-bold text-text-primary mb-6">
                      Choose Your Size
                    </h3>
                    
                    {/* Desktop/Tablet: Stacked cards */}
                    <div className="hidden sm:block space-y-4">
                      {Object.entries(pricing).map(([size, priceInfo]) => (
                    <div
                      key={size}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedSize === size 
                          ? 'border-cyclamen bg-cyclamen/5 shadow-md' 
                          : 'border-gray-200 hover:border-cyclamen/50 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-geist font-semibold text-lg text-text-primary">
                              {size.replace('x', '" × ')}"
                            </p>
                            {size === '20x30' && (
                              <div className="relative group">
                                <Star 
                                  className="w-4 h-4 text-yellow-500 fill-yellow-500 cursor-pointer" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTooltip(!showTooltip);
                                    setTimeout(() => setShowTooltip(false), 2000);
                                  }}
                                />
                                {/* Hover tooltip for desktop */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 hidden sm:block">
                                  Actual Mona Lisa Size!
                                </div>
                                {/* Click tooltip for mobile */}
                                {showTooltip && (
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10 animate-pulse sm:hidden">
                                    Actual Mona Lisa Size!
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <h4 className="font-arvo font-bold text-base text-text-primary mb-1">
                            {size === '12x18' ? 'The Charmer' :
                             (size === '16x24' || size === '18x24') ? 'The Showstopper' :
                             'The Masterpiece'}
                          </h4>
                          <p className="text-sm text-gray-600 font-geist">
                            {size === '12x18' ? 'Perfect for desks, nightstands, and cozy personal spaces' :
                             (size === '16x24' || size === '18x24') ? 'Ideal for living rooms, hallways, and office walls' :
                             'Statement piece that transforms any room'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-arvo font-bold text-xl text-text-primary">
                            ${priceInfo.price}
                          </p>
                          <p className="text-sm text-gray-500 line-through font-geist">
                            ${priceInfo.originalPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile: Single row with size buttons */}
                <div className="sm:hidden">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(pricing).map(([size, priceInfo]) => (
                      <button
                        key={size}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 text-center ${
                          selectedSize === size 
                            ? 'border-cyclamen bg-cyclamen/5 shadow-md' 
                            : 'border-gray-200 hover:border-cyclamen/50 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <p className="font-geist font-semibold text-sm text-text-primary">
                            {size.replace('x', '" × ')}"
                          </p>
                          {size === '20x30' && (
                            <div className="relative">
                              <Star 
                                className="w-3 h-3 text-yellow-500 fill-yellow-500 cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowTooltip(!showTooltip);
                                  setTimeout(() => setShowTooltip(false), 2000);
                                }}
                              />
                              {showTooltip && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10 animate-pulse sm:hidden">
                                  Actual Mona Lisa Size!
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="font-arvo font-bold text-lg text-cyclamen">
                          ${priceInfo.price}
                        </p>
                        <p className="text-xs text-gray-500 line-through font-geist">
                          ${priceInfo.originalPrice}
                        </p>
                      </button>
                    ))}
                  </div>
                  
                  {/* Selected size details below */}
                  <div className="text-center space-y-3">
                    <div>
                      <h4 className="font-arvo font-bold text-lg text-text-primary mb-1">
                        {selectedSize === '12x18' ? 'The Charmer' :
                         (selectedSize === '16x24' || selectedSize === '18x24') ? 'The Showstopper' :
                         'The Masterpiece'}
                      </h4>
                      <p className="text-sm text-gray-600 font-geist">
                        {selectedSize === '12x18' ? 'Perfect for desks, nightstands, and cozy personal spaces' :
                         (selectedSize === '16x24' || selectedSize === '18x24') ? 'Ideal for living rooms, hallways, and office walls' :
                         'Statement piece that transforms any room'}
                      </p>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>

              {/* Quantity Selection - only show for non-digital products */}
              {productType !== 'digital' && (
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-sm text-gray-600 font-geist">Quantity:</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-cyclamen/10 hover:border-cyclamen disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-lg font-arvo font-bold min-w-[2rem] text-center text-text-primary">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-cyclamen/10 hover:border-cyclamen disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              )}

              {/* Shipping Selection */}
              {productType !== 'digital' && (
                <div className="py-3 border-t border-gray-100">
                  {loadingShipping ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyclamen"></div>
                      <span className="ml-2 text-sm text-gray-600 font-geist">Loading shipping...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-geist">
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
                            className={`text-sm px-3 py-1 rounded-lg font-geist font-medium transition-colors ${
                              selectedShipping === shippingOptions.find(opt => opt.cost > 0)?.id
                                ? 'bg-cyclamen text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-cyclamen/10 hover:text-cyclamen'
                            }`}
                          >
                            Express +$20
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-geist">
                        {selectedShipping === shippingOptions.find(opt => opt.cost > 0)?.id 
                          ? 'Ships within 2-5 business days' 
                          : 'Ships within 5-9 business days'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upsell for Canvas Stretched */}
              {productType === 'canvas_stretched' && (
                <div className="bg-naples-yellow/10 border border-naples-yellow/30 rounded-xl p-4">
                  <h4 className="font-arvo font-bold text-text-primary mb-2">
                    ✨ Upgrade to Framed Canvas
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 font-geist">
                    Add professional framing for a museum-quality finish. Perfect for gifting!
                  </p>
                  <button
                    onClick={handleUpsell}
                    className="text-sm text-cyclamen hover:text-cyclamen/80 font-geist font-medium"
                  >
                    See Framed Options →
                  </button>
                </div>
              )}
            </div>

            {/* Bottom: Purchase Section */}
            <div className="space-y-4 border-t border-gray-100 pt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-geist">{error}</p>
                </div>
              )}
              
              <button
                onClick={handlePurchase}
                disabled={loading}
                className={`w-full bg-cyclamen hover:bg-cyclamen/90 text-white font-arvo font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 
                 productType === 'digital' 
                   ? `Download Now - $${currentPrice}`
                   : `Buy Now - $${(currentPrice * quantity).toFixed(0)}`}
              </button>
              
              <div className="text-center text-sm text-gray-500 space-y-1 font-geist">
                {productType === 'digital' ? (
                  <>
                    <p>✓ Instant digital download</p>
                  </>
                ) : productType === 'art_print' ? (
                  <>
                    <p>✓ Digital PNG file included</p>
                    <p>✓ Free shipping worldwide</p>
                  </>
                ) : productType === 'canvas_stretched' ? (
                  <>
                    <p>✓ Digital PNG file included</p>
                  </>
                ) : (
                  <>
                    <p>✓ Digital PNG file included</p>
                    <p>✓ Free shipping worldwide</p>
                  </>
                )}
                
                {/* Product-specific features */}
                {productType === 'canvas_stretched' && (
                  <>
                    <p>✓ Premium cotton-poly canvas blend</p>
                    <p>✓ Stretched on 1.25" wooden frame</p>
                    <p>✓ Ready to hang with mounting hardware</p>
                    <p>✓ Fade-resistant UV inks</p>
                  </>
                )}
                
                {productType === 'canvas_framed' && (
                  <>
                    <p>✓ Premium cotton-poly canvas blend</p>
                    <p>✓ Gallery-wrapped with professional frame</p>
                    <p>✓ Museum-quality matting and glass</p>
                    <p>✓ Ready to display with hanging hardware</p>
                  </>
                )}
                
                <p>✓ Biggest Grin Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

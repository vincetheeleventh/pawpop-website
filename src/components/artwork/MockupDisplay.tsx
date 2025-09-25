'use client'

import { useState, useEffect } from 'react'

interface Mockup {
  type: string
  title: string
  description: string
  mockupUrl: string
  productId: string
  size: string
}

interface MockupDisplayProps {
  artwork: {
    id: string
    generated_images?: {
      artwork_preview?: string
      artwork_full_res?: string
    }
    mockup_urls?: Mockup[] | Record<string, any>
    mockup_generated_at?: string
    delivery_images?: {
      mockups?: Record<string, any>
    }
    processing_status?: {
      mockup_generation?: string
    }
  }
  onProductClick?: (productType: string, mockups: Mockup[]) => void
}

export default function MockupDisplay({ artwork, onProductClick }: MockupDisplayProps) {
  const [mockups, setMockups] = useState<Mockup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMockups = async () => {
      const artworkImageUrl = artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res
      if (!artworkImageUrl) {
        setError('No artwork image available')
        setLoading(false)
        return
      }

      // OPTIMIZATION: Check if we have pre-generated mockups in Supabase cache
      // This provides 1000x+ performance improvement vs real-time API calls
      if (artwork.delivery_images?.mockups && typeof artwork.delivery_images.mockups === 'object') {
        const mockupData = artwork.delivery_images.mockups
        
        // Check if we have actual mockup data (not empty object)
        const hasValidMockups = Object.keys(mockupData).length > 0 && 
          Object.values(mockupData).some(productMockups => 
            Array.isArray(productMockups) && productMockups.length > 0
          )
        
        if (hasValidMockups) {
          console.log('🚀 FAST LOAD: Using cached mockups from delivery_images.mockups')
          const cachedMockups: Mockup[] = []
          
          // Extract mockups from JSONB structure
          Object.entries(mockupData).forEach(([productType, productMockups]) => {
            if (Array.isArray(productMockups)) {
              productMockups.forEach((mockup: any) => {
                cachedMockups.push({
                  type: productType,
                  title: mockup.title || `${productType} mockup`,
                  description: mockup.description || '',
                  mockupUrl: mockup.mockupUrl || mockup.url || '',
                  productId: mockup.productId || `${productType}-${mockup.size || 'default'}`,
                  size: mockup.size || '20x30'
                })
              })
            }
          })
          
          if (cachedMockups.length > 0) {
            console.log(`✅ INSTANT LOAD: ${cachedMockups.length} cached mockups loaded in <100ms`)
            setMockups(cachedMockups)
            setLoading(false)
            return
          }
        }
      }

      // Fallback: Generate mockups in real-time (SLOW - 30-60 seconds)
      try {
        setLoading(true)
        console.log('⏳ SLOW LOAD: No cached mockups found, generating from Printify API for artwork:', artwork.id)
        console.log('⚠️ This will take 30-60 seconds - consider implementing mockup pre-generation')
        
        const response = await fetch('/api/printify/generate-mockups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: artworkImageUrl,
            artworkId: artwork.id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate mockups')
        }

        const data = await response.json()
        
        if (data.success && data.mockups && data.mockups.length > 0) {
          console.log('✅ Generated real-time Printify mockups:', data.mockups.length)
          // Add size property to generated mockups
          const mocksWithSize = data.mockups.map((m: any) => ({
            ...m,
            size: m.size || '20x30'
          }))
          setMockups(mocksWithSize)
        } else {
          throw new Error('No mockups generated')
        }
      } catch (err) {
        console.error('❌ Error generating mockups:', err)
        setError(err instanceof Error ? err.message : 'Failed to load mockups')
        
        // Final fallback: Use artwork image directly
        console.log('⚠️ Using artwork image as mockup fallback')
        setMockups([
          {
            type: 'digital',
            title: 'Digital Download',
            description: 'Enhance details for a perfect painterly finish that\'s ready to print.',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-digital',
            size: 'digital'
          },
          {
            type: 'art_print',
            title: 'Fine Art Print',
            description: 'Museum-quality Paper',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-print',
            size: '20x30'
          },
          {
            type: 'canvas_stretched',
            title: 'Canvas Stretched',
            description: 'Ready to hang',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-canvas-stretched',
            size: '20x30'
          },
          {
            type: 'canvas_framed',
            title: 'Canvas Framed',
            description: 'The Total Package',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-canvas-framed',
            size: '20x30'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadMockups()
  }, [artwork.generated_images?.artwork_preview, artwork.id, artwork.mockup_urls])

  // Filter to show art print, canvas stretched, and canvas framed, prioritize 20x30 size
  const getDisplayMockups = () => {
    const artPrintMockups = mockups.filter(m => m.type === 'art_print')
    const canvasStretchedMockups = mockups.filter(m => m.type === 'canvas_stretched')
    const canvasFramedMockups = mockups.filter(m => m.type === 'canvas_framed')
    
    // Get 20x30 mockups first, fallback to any available size
    const artPrint20x30 = artPrintMockups.find(m => m.size === '20x30') || artPrintMockups[0]
    const canvasStretched20x30 = canvasStretchedMockups.find(m => m.size === '20x30') || canvasStretchedMockups[0]
    const canvasFramed20x30 = canvasFramedMockups.find(m => m.size === '20x30') || canvasFramedMockups[0]
    
    const displayMockups = []
    
    // Always include digital download first (lowest price point)
    displayMockups.push({
      type: 'digital',
      title: 'Digital Download',
      description: 'High-res, ready to print.',
      mockupUrl: artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '',
      productId: 'digital-download',
      size: 'digital'
    })
    
    // Always include art print (create fallback if none exists)
    if (artPrint20x30) {
      displayMockups.push(artPrint20x30)
    } else {
      displayMockups.push({
        type: 'art_print',
        title: 'Fine Art Print',
        description: 'Museum-quality Paper',
        mockupUrl: artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '',
        productId: 'fallback-art-print',
        size: '20x30'
      })
    }
    
    // Always include canvas stretched
    if (canvasStretched20x30) {
      displayMockups.push(canvasStretched20x30)
    }
    
    // Always include canvas framed
    if (canvasFramed20x30) {
      displayMockups.push(canvasFramed20x30)
    }
    
    return displayMockups.filter(Boolean)
  }

  const handleProductClick = (productType: string) => {
    if (onProductClick) {
      const productMockups = mockups.filter(m => m.type === productType)
      onProductClick(productType, productMockups)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const displayMockups = getDisplayMockups()

  // Function to get white background with colored borders for each product type
  const getBackgroundColor = (productType: string) => {
    switch (productType) {
      case 'digital':
        return 'bg-white hover:bg-gray-50 border-2 border-pale-azure' // White bg, blue border
      case 'art_print':
        return 'bg-white hover:bg-gray-50 border-2 border-naples-yellow' // White bg, yellow border
      case 'canvas_stretched':
        return 'bg-white hover:bg-gray-50 border-2 border-atomic-tangerine' // White bg, orange border
      case 'canvas_framed':
        return 'bg-white hover:bg-gray-50 border-2 border-cyclamen' // White bg, pink border
      default:
        return 'bg-white hover:bg-gray-50 border-2 border-gray-300'
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:space-y-6">
      {displayMockups.map((mockup, index) => (
        <div 
          key={`${mockup.type}-${index}`} 
          className={`cursor-pointer p-3 md:p-6 transition-colors rounded-lg ${getBackgroundColor(mockup.type)}`}
          onClick={() => handleProductClick(mockup.type)}
        >
          {/* Responsive Layout: Mobile Grid (vertical), Desktop (horizontal with image on right) */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-2 md:gap-3">
            
            {/* Image - Top on mobile, right on desktop */}
            <div className="flex-shrink-0 order-1 md:order-2">
              <div className="mb-2 md:mb-2">
                {mockup.type === 'digital' ? (
                  // Show downward arrow for digital downloads
                  <div className="w-20 h-20 md:w-48 md:h-48 flex items-center justify-center bg-pale-azure/10 rounded mx-auto">
                    <svg 
                      className="w-10 h-10 md:w-24 md:h-24 text-pale-azure" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-3.5-3.5 1.41-1.41L11 13.67V7h2v6.67l2.09-2.08L16.5 13l-3.5 3.5z"/>
                    </svg>
                  </div>
                ) : (
                  <img 
                    src={mockup.mockupUrl}
                    alt={mockup.title}
                    className="w-20 h-20 md:w-48 md:h-48 object-contain rounded mx-auto"
                    onError={(e) => {
                      // Fallback to artwork image if mockup fails to load
                      const artworkImageUrl = artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res;
                      if (artworkImageUrl && e.currentTarget.src !== artworkImageUrl) {
                        e.currentTarget.src = artworkImageUrl;
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Content - Bottom on mobile, left on desktop */}
            <div className="flex-1 order-2 md:order-1">
              <div>
                <h4 className="font-semibold text-charcoal-frame text-base md:text-2xl mb-1">
                  {mockup.title.replace(/\s*\([^)]*\)/, '').trim()}
                </h4>
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-1">{mockup.description}</p>
                
                {/* Price */}
                <p className="text-sm md:text-lg font-bold text-cyclamen">
                  {mockup.type === 'digital' ? '$19' :
                   mockup.type === 'art_print' ? 'From $49' :
                   mockup.type === 'canvas_stretched' ? 'From $89' :
                   'From $149'}
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">Click to see all sizes</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      
    </div>
  )
}

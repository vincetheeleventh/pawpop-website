import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.printify.com/v1'
const TOKEN = process.env.PRINTIFY_API_TOKEN!
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!

// Product configuration - Updated with Blueprint 1220 Fine Art Rolled Posters
const PRODUCT_CONFIG = {
  ART_PRINT: {
    US: {
      blueprint_id: 1220, // Rolled Posters (Fine Art)
      print_provider_id: 105, // Jondo
      variants: [
        { id: 'fine_art_12x18', size: '12x18', price: 2900, variant_id: 92396 }, // $29 CAD - 12″ x 18″ (Vertical) / Fine Art
        { id: 'fine_art_18x24', size: '18x24', price: 3900, variant_id: 92400 }, // $39 CAD - 18″ x 24″ (Vertical) / Fine Art
        { id: 'fine_art_20x30', size: '20x30', price: 4800, variant_id: 92402 } // $48 CAD - 20″ x 30″ (Vertical) / Fine Art
      ]
    },
    // Future EU option - Blueprint 494 (Giclée Art Print) with Print Pigeons (ID: 36)
    // Currently not implemented - ships to EU only, no UK/US/CA coverage
    EUROPE_FUTURE: {
      blueprint_id: 494, // Giclée Art Print
      print_provider_id: 36, // Print Pigeons
      variants: [
        { id: 'giclee_12x18', size: '12x18', price: 2900 }, // $29 CAD
        { id: 'giclee_18x24', size: '18x24', price: 3900 }, // $39 CAD
        { id: 'giclee_20x30', size: '20x30', price: 4800 } // $48 CAD
      ]
    }
  },
  CANVAS_STRETCHED: {
    blueprint_id: 1159, // Matte Canvas, Stretched, 1.25"
    print_provider_id: 105, // Jondo
    variants: [
      { id: 'canvas_12x18', size: '12x18', price: 5900 }, // $59 CAD
      { id: 'canvas_18x24', size: '18x24', price: 7900 }, // $79 CAD
      { id: 'canvas_20x30', size: '20x30', price: 9900 } // $99 CAD
    ]
  },
  CANVAS_FRAMED: {
    blueprint_id: 944, // Matte Canvas, Framed Multi-color
    print_provider_id: 105, // Jondo
    variants: [
      { id: 'framed_12x18', size: '12x18', price: 9900 }, // $99 CAD
      { id: 'framed_18x24', size: '18x24', price: 11900 }, // $119 CAD
      { id: 'framed_20x30', size: '20x30', price: 14900 } // $149 CAD
    ]
  }
}

// Cache for variant IDs to avoid repeated API calls
const catalogCache: {
  artPrintVariants?: number[]
  canvasStretchedVariants?: number[]
  canvasFramedVariants?: number[]
} = {}

async function fetchFromPrintify(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PawPop-NextJS',
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function resolveVariantIds() {
  console.log('🔍 Resolving Printify variant IDs using known blueprint IDs...')

  // Use the new Blueprint 1220 Fine Art variant IDs for US market
  catalogCache.artPrintVariants = [92396, 92400, 92402] // 12″×18″, 18″×24″, 20″×30″ Fine Art
  console.log('✅ Using Blueprint 1220 Fine Art variant IDs:', catalogCache.artPrintVariants)

  // Get variants for canvas stretched (Blueprint 1159, Jondo provider 105)
  try {
    const canvasStretchedVariants = await fetchFromPrintify(
      `/catalog/blueprints/${PRODUCT_CONFIG.CANVAS_STRETCHED.blueprint_id}/print_providers/${PRODUCT_CONFIG.CANVAS_STRETCHED.print_provider_id}/variants.json`
    )
    
    // Filter for specific sizes: 12x18, 18x24, 20x30 (using Unicode quotes)
    const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″']
    catalogCache.canvasStretchedVariants = canvasStretchedVariants.variants?.filter((v: any) => 
      targetSizes.some(size => v.title?.includes(size))
    ).map((v: any) => v.id) || []
    console.log('✅ Using canvas stretched variants:', catalogCache.canvasStretchedVariants)
  } catch (error) {
    console.log('⚠️ Could not resolve canvas stretched variants, using fallback')
    catalogCache.canvasStretchedVariants = []
  }

  // Get variants for canvas framed (Blueprint 944, Jondo provider 105)
  try {
    const canvasFramedVariants = await fetchFromPrintify(
      `/catalog/blueprints/${PRODUCT_CONFIG.CANVAS_FRAMED.blueprint_id}/print_providers/${PRODUCT_CONFIG.CANVAS_FRAMED.print_provider_id}/variants.json`
    )
    
    // Filter for specific sizes: 12x18, 18x24, 20x30 (using Unicode quotes)
    const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″']
    catalogCache.canvasFramedVariants = canvasFramedVariants.variants?.filter((v: any) => 
      targetSizes.some(size => v.title?.includes(size))
    ).map((v: any) => v.id) || []
    console.log('✅ Using canvas framed variants:', catalogCache.canvasFramedVariants)
  } catch (error) {
    console.log('⚠️ Could not resolve canvas framed variants, using fallback')
    catalogCache.canvasFramedVariants = []
  }

  console.log('✅ Variant IDs resolved:', catalogCache)
  return catalogCache
}

async function uploadImageToPrintify(imageUrl: string, fileName: string) {
  console.log('📤 Uploading image to Printify...')
  
  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
  }
  
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  const uploadResponse = await fetchFromPrintify('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      contents: base64Image
    })
  })
  
  console.log('✅ Image uploaded to Printify:', uploadResponse.id)
  return uploadResponse.id
}

async function createProductWithMockups(
  uploadId: string,
  blueprintId: number,
  printProviderId: number,
  variantIds: number[],
  title: string,
  description: string,
  targetSize?: string
) {
  console.log(`🏭 Creating product: ${title}`)
  
  // Filter variants to get the specific size if specified
  let selectedVariants = variantIds
  if (targetSize) {
    // Try to find the specific size variant dynamically from the API
    try {
      const variantDetails = await fetchFromPrintify(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
      )
      
      // Map size to search patterns
      const sizePatterns: { [key: string]: string } = {
        '12x18': '12″ x 18″',
        '18x24': '18″ x 24″', 
        '20x30': '20″ x 30″'
      }
      
      const targetPattern = sizePatterns[targetSize]
      if (targetPattern) {
        const targetVariant = variantDetails.variants?.find((v: any) => 
          v.title?.includes(targetPattern) && 
          (v.title?.toLowerCase().includes('vertical') || !v.title?.toLowerCase().includes('horizontal'))
        ) || variantDetails.variants?.find((v: any) => 
          v.title?.includes(targetPattern)
        )
        
        if (targetVariant) {
          selectedVariants = [targetVariant.id]
          console.log(`📏 Using ${targetSize} variant: ${targetVariant.title} (ID: ${targetVariant.id})`)
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch variant details dynamically, using fallback variant selection')
      // Use the first variant as fallback
      selectedVariants = [variantIds[0]]
    }
  }
  
  // Get the correct pricing based on blueprint and provider
  const getVariantPrice = (variantId: number) => {
    // For canvas framed (Blueprint 944)
    if (blueprintId === PRODUCT_CONFIG.CANVAS_FRAMED.blueprint_id) {
      // Use tiered pricing based on variant position
      const variantIndex = selectedVariants.indexOf(variantId)
      if (variantIndex === 0) return 9900  // $99 CAD for 12x18
      if (variantIndex === 1) return 11900 // $119 CAD for 18x24
      return 14900 // $149 CAD for 20x30
    }
    
    // For canvas stretched (Blueprint 1159)
    if (blueprintId === PRODUCT_CONFIG.CANVAS_STRETCHED.blueprint_id) {
      const variantIndex = selectedVariants.indexOf(variantId)
      if (variantIndex === 0) return 5900  // $59 CAD for 12x18
      if (variantIndex === 1) return 7900  // $79 CAD for 18x24
      return 9900 // $99 CAD for 20x30
    }
    
    // For art prints (Blueprint 1220 Fine Art)
    if (blueprintId === PRODUCT_CONFIG.ART_PRINT.US.blueprint_id) {
      const variantIndex = selectedVariants.indexOf(variantId)
      if (variantIndex === 0) return 2900  // $29 CAD for 12x18
      if (variantIndex === 1) return 3900  // $39 CAD for 18x24
      return 4800 // $48 CAD for 20x30
    }
    
    // Fallback pricing
    return 4800 // $48 CAD default
  }

  // Create product draft with print areas
  const productData = {
    title,
    description,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: selectedVariants.map(id => ({ 
      id, 
      price: getVariantPrice(id), 
      is_enabled: true 
    })),
    print_areas: [{
      variant_ids: selectedVariants,
      placeholders: [{
        position: 'front',
        images: [{
          id: uploadId,
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          angle: 0
        }]
      }]
    }],
    tags: ['preview', 'pawpop']
  }
  
  const product = await fetchFromPrintify(`/shops/${SHOP_ID}/products.json`, {
    method: 'POST',
    body: JSON.stringify(productData)
  })
  
  console.log('✅ Product created:', product.id)
  
  // Fetch the product to get generated mockups
  const fullProduct = await fetchFromPrintify(`/shops/${SHOP_ID}/products/${product.id}.json`)
  
  console.log('🖼️ Available mockup images:', fullProduct.images?.length || 0)
  
  // Log all available mockup positions and URLs for debugging
  if (fullProduct.images?.length > 0) {
    console.log('📍 Available mockup positions:', fullProduct.images.map((img: any) => ({
      position: img.position,
      is_default: img.is_default,
      variant_ids: img.variant_ids,
      camera_label: img.src?.match(/camera_label=([^&]*)/)?.[1] || 'none'
    })))
  }
  
  // Get Context 3 mockups (lifestyle/environmental shots in living room)
  // Since Printify returns multiple mockups per variant, we need to select the right one
  // Context 3 is typically the third mockup (index 2) - the lifestyle shot
  const contextMockups = []
  
  for (const variantId of selectedVariants) {
    const variantMockups = fullProduct.images?.filter((img: any) => 
      img.variant_ids?.includes(variantId)
    ) || []
    
    // Sort by order or use index to get consistent results
    variantMockups.sort((a: any, b: any) => {
      if (a.is_default && !b.is_default) return -1
      if (!a.is_default && b.is_default) return 1
      return (a.order || 0) - (b.order || 0)
    })
    
    // Try to find Context 3 mockup by checking camera_label or URL patterns
    // Context 3 mockups often have specific camera angles or URL patterns
    let contextMockup = variantMockups.find((mockup: any) => {
      const url = mockup.src || ''
      return url.includes('camera_label=context-3') || 
             url.includes('camera_label=context3') ||
             url.includes('camera_label=lifestyle') ||
             url.includes('camera_label=room')
    })
    
    // If no specific Context 3 found, try the third mockup (index 2) which is often lifestyle
    if (!contextMockup) {
      contextMockup = variantMockups[2] || variantMockups[1] || variantMockups[0]
    }
    if (contextMockup) {
      contextMockups.push(contextMockup)
    }
  }
  
  console.log(`🎯 Selected Context 3 mockups: ${contextMockups.length}`)
  console.log('🏠 Context mockup details:', contextMockups.map(m => ({ 
    src: m.src?.substring(0, 100) + '...', 
    is_default: m.is_default,
    order: m.order 
  })))
  
  // Use the selected context mockups
  const mockupUrls = contextMockups.length > 0 
    ? contextMockups.map((img: any) => img.src)
    : fullProduct.images?.map((img: any) => img.src) || []
  
  return {
    productId: product.id,
    mockupUrls,
    mockupDetails: contextMockups.length > 0 ? contextMockups : fullProduct.images
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, artworkId } = body

    if (!imageUrl || !artworkId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, artworkId' },
        { status: 400 }
      )
    }

    if (!TOKEN || !SHOP_ID) {
      console.log('⚠️ Printify not configured - using fallback mockups')
      // Return fallback mockups when Printify isn't configured
      return NextResponse.json({
        success: true,
        mockups: [
          {
            type: 'art_print',
            title: 'Fine Art Print',
            description: 'Museum-quality fine art paper (285 g/m²)',
            mockupUrl: imageUrl, // Use the actual artwork image
            productId: 'fallback-print'
          },
          {
            type: 'canvas_stretched',
            title: 'Canvas Stretched',
            description: 'Gallery-wrapped, ready to hang',
            mockupUrl: imageUrl, // Use the actual artwork image
            productId: 'fallback-canvas-stretched'
          },
          {
            type: 'canvas_framed',
            title: 'Canvas Framed',
            description: 'Professional framing included',
            mockupUrl: imageUrl, // Use the actual artwork image
            productId: 'fallback-canvas-framed'
          }
        ]
      })
    }

    console.log('🖼️ Generating Printify mockups for artwork:', artworkId)

    // Clear cache and resolve variant IDs using known blueprint IDs
    catalogCache.artPrintVariants = undefined
    catalogCache.canvasStretchedVariants = undefined  
    catalogCache.canvasFramedVariants = undefined
    console.log('🗑️ Cleared variant cache, forcing fresh resolution')
    
    const catalog = await resolveVariantIds()
    
    // Upload image to Printify
    const uploadId = await uploadImageToPrintify(imageUrl, `pawpop-artwork-${artworkId}.jpg`)
    
    const mockups = []

    // Generate Art Print mockups for all sizes using Blueprint 1220 + Jondo (105) - Fine Art Paper
    console.log('🖼️ Art Print Variants Available:', catalog.artPrintVariants?.length || 0)
    console.log('🖼️ Art Print Variant IDs:', catalog.artPrintVariants)
    if (catalog.artPrintVariants?.length) {
      const sizes = ['12x18', '18x24', '20x30'];
      for (const size of sizes) {
        try {
          console.log(`🎨 Creating art print mockup for size: ${size}`)
          console.log(`🎨 Using blueprint: ${PRODUCT_CONFIG.ART_PRINT.US.blueprint_id}, provider: ${PRODUCT_CONFIG.ART_PRINT.US.print_provider_id}`)
          
          const artPrint = await createProductWithMockups(
            uploadId,
            PRODUCT_CONFIG.ART_PRINT.US.blueprint_id,
            PRODUCT_CONFIG.ART_PRINT.US.print_provider_id,
            catalog.artPrintVariants,
            `PawPop Fine Art Print ${size} - ${artworkId}`,
            'Custom Mona Lisa style fine art print on premium paper',
            size
          )
          
          console.log(`🎨 Art print ${size} result:`, { 
            mockupUrls: artPrint.mockupUrls?.length || 0, 
            productId: artPrint.productId 
          })
          
          if (artPrint.mockupUrls.length > 0) {
            console.log(`✅ Art print ${size} mockup created successfully`)
            mockups.push({
              type: 'art_print',
              title: `Fine Art Print (${size}")`,
              description: 'Museum-quality fine art paper (285 g/m²)',
              mockupUrl: artPrint.mockupUrls[0],
              productId: artPrint.productId,
              mockupDetails: artPrint.mockupDetails?.[0]
            })
          } else {
            console.log(`⚠️ Art print ${size} created but no mockup URLs returned`)
          }
        } catch (error) {
          console.error(`❌ Failed to create art print ${size} mockup:`, error)
          console.error(`❌ Error details:`, error instanceof Error ? error.message : String(error))
        }
      }
    } else {
      console.log('❌ No art print variants available - skipping art print generation')
    }

    // Generate Canvas Stretched mockups for all sizes using Blueprint 1159 + Jondo (105)
    if (catalog.canvasStretchedVariants?.length) {
      const sizes = ['12x18', '18x24', '20x30'];
      for (const size of sizes) {
        try {
          const canvasStretched = await createProductWithMockups(
            uploadId,
            PRODUCT_CONFIG.CANVAS_STRETCHED.blueprint_id,
            PRODUCT_CONFIG.CANVAS_STRETCHED.print_provider_id,
            catalog.canvasStretchedVariants,
            `PawPop Canvas Stretched ${size} - ${artworkId}`,
            'Custom Mona Lisa style stretched canvas',
            size
          )
          
          if (canvasStretched.mockupUrls.length > 0) {
            mockups.push({
              type: 'canvas_stretched',
              title: `Canvas Stretched (${size}")`,
              description: 'Gallery-wrapped, ready to hang',
              mockupUrl: canvasStretched.mockupUrls[0],
              productId: canvasStretched.productId,
              mockupDetails: canvasStretched.mockupDetails?.[0]
            })
          }
        } catch (error) {
          console.error(`❌ Failed to create canvas stretched ${size} mockup:`, error)
        }
      }
    }

    // Generate Canvas Framed mockups for all sizes using Blueprint 944 + Jondo (105)
    if (catalog.canvasFramedVariants?.length) {
      const sizes = ['12x18', '18x24', '20x30'];
      for (const size of sizes) {
        try {
          const canvasFramed = await createProductWithMockups(
            uploadId,
            PRODUCT_CONFIG.CANVAS_FRAMED.blueprint_id,
            PRODUCT_CONFIG.CANVAS_FRAMED.print_provider_id,
            catalog.canvasFramedVariants,
            `PawPop Canvas Framed ${size} - ${artworkId}`,
            'Custom Mona Lisa style framed canvas',
            size
          )
          
          if (canvasFramed.mockupUrls.length > 0) {
            mockups.push({
              type: 'canvas_framed',
              title: `Canvas Framed (${size}")`,
              description: 'Professional framing included',
              mockupUrl: canvasFramed.mockupUrls[0],
              productId: canvasFramed.productId,
              mockupDetails: canvasFramed.mockupDetails?.[0]
            })
          }
        } catch (error) {
          console.error(`❌ Failed to create canvas framed ${size} mockup:`, error)
        }
      }
    }

    if (mockups.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any mockups' },
        { status: 500 }
      )
    }

    console.log(`✅ Generated ${mockups.length} mockups successfully`)

    // Store mockups in Supabase for faster future loading (new JSONB schema)
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      
      if (supabaseAdmin) {
        // Organize mockups by product type and size for the new schema
        const mockupsByType: Record<string, any[]> = {}
        
        mockups.forEach(mockup => {
          if (!mockupsByType[mockup.type]) {
            mockupsByType[mockup.type] = []
          }
          
          // Extract size from title (e.g., "Canvas Stretched (20x30")" -> "20x30")
          const sizeMatch = mockup.title.match(/\((\d+x\d+)/)
          const size = sizeMatch ? sizeMatch[1] : '20x30'
          
          mockupsByType[mockup.type].push({
            title: mockup.title,
            description: mockup.description,
            mockupUrl: mockup.mockupUrl,
            productId: mockup.productId,
            size: size,
            mockupDetails: mockup.mockupDetails
          })
        })

        // Get existing delivery_images to preserve other data
        const { data: existingArtwork } = await supabaseAdmin
          .from('artworks')
          .select('delivery_images')
          .eq('id', artworkId)
          .single()
        
        const existingDeliveryImages = existingArtwork?.delivery_images || {}
        
        // Update delivery_images.mockups with the new JSONB structure while preserving other fields
        await supabaseAdmin
          .from('artworks')
          .update({
            delivery_images: {
              ...existingDeliveryImages,
              mockups: mockupsByType
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', artworkId)
        
        console.log('✅ Mockups stored in Supabase successfully')
      }
    } catch (dbError) {
      console.error('❌ Error storing mockups in database:', dbError)
    }

    return NextResponse.json({
      success: true,
      mockups
    })

  } catch (error) {
    console.error('❌ Error generating Printify mockups:', error)
    return NextResponse.json(
      { error: 'Failed to generate mockups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

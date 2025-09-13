import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.printify.com/v1'
const TOKEN = process.env.PRINTIFY_API_TOKEN!
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!

// Product configuration from PRODUCTS.md - Updated with new blueprint IDs
const PRODUCT_CONFIG = {
  ART_PRINT: {
    US_CA: {
      blueprint_id: 1191, // Photo Art Paper Posters
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'poster_12x18', size: '12x18', price: 2900 }, // $29 CAD
        { id: 'poster_18x24', size: '18x24', price: 3900 }, // $39 CAD
        { id: 'poster_20x30', size: '20x30', price: 4800 } // $48 CAD
      ]
    },
    EUROPE: {
      blueprint_id: 494, // Giclee Art Print
      print_provider_id: 1, // Generic Brand
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

  // Hardcode the known working art print variant IDs to bypass resolution issues
  catalogCache.artPrintVariants = [91677, 91693, 91695] // 12x18, 18x24, 20x30
  console.log('✅ Using hardcoded art print variant IDs:', catalogCache.artPrintVariants)

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
    console.error('❌ Failed to resolve canvas stretched variants:', error)
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
    console.error('❌ Failed to resolve canvas framed variants:', error)
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
      console.error('❌ Failed to fetch variant details:', error)
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
    
    // For art prints (Blueprint 1191 or 494)
    if (blueprintId === PRODUCT_CONFIG.ART_PRINT.US_CA.blueprint_id || 
        blueprintId === PRODUCT_CONFIG.ART_PRINT.EUROPE.blueprint_id) {
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
  
  // Filter mockups to get context 1 (front-facing views) consistently
  const contextMockups = fullProduct.images?.filter((img: any) => {
    // Look for context 1 mockups (front-facing, clean product shots)
    const isContext1Mockup = img.position === 'front' || 
                            img.position === 'context1' ||
                            img.is_default // Default images are usually front-facing
    
    // Ensure it's for our selected variants
    const hasCorrectVariant = selectedVariants.some(variantId => 
      img.variant_ids?.includes(variantId)
    )
    
    return isContext1Mockup && hasCorrectVariant
  }) || []
  
  console.log(`🎯 Found ${contextMockups.length} context mockups`)
  
  // If no context mockups, fall back to any available mockups
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
            title: 'Premium Art Print',
            description: 'Museum-quality paper',
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

    // Generate Art Print mockups for all sizes using Blueprint 1191 + Print Geek (27)
    console.log('🖼️ Art Print Variants Available:', catalog.artPrintVariants?.length || 0)
    console.log('🖼️ Art Print Variant IDs:', catalog.artPrintVariants)
    if (catalog.artPrintVariants?.length) {
      const sizes = ['12x18', '18x24', '20x30'];
      for (const size of sizes) {
        try {
          console.log(`🎨 Creating art print mockup for size: ${size}`)
          console.log(`🎨 Using blueprint: ${PRODUCT_CONFIG.ART_PRINT.US_CA.blueprint_id}, provider: ${PRODUCT_CONFIG.ART_PRINT.US_CA.print_provider_id}`)
          
          const artPrint = await createProductWithMockups(
            uploadId,
            PRODUCT_CONFIG.ART_PRINT.US_CA.blueprint_id,
            PRODUCT_CONFIG.ART_PRINT.US_CA.print_provider_id,
            catalog.artPrintVariants,
            `PawPop Art Print ${size} - ${artworkId}`,
            'Custom Mona Lisa style art print',
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
              title: `Premium Art Print (${size}")`,
              description: 'Museum-quality paper',
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

        // Update mockup_urls with the new JSONB structure
        await supabaseAdmin
          .from('artworks')
          .update({
            mockup_urls: mockupsByType,
            mockup_generated_at: new Date().toISOString(),
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

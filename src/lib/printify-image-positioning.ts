// src/lib/printify-image-positioning.ts
import { ProductType } from './printify';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface PrintifyImagePlacement {
  x: number;        // 0-1, horizontal position (0.5 = center)
  y: number;        // 0-1, vertical position (0.5 = center)
  scale: number;    // Scale factor (1 = original size)
  angle: number;    // Rotation in degrees
}

export interface ProductCanvasSpecs {
  printAreaWidth: number;   // Print area width in pixels
  printAreaHeight: number;  // Print area height in pixels
  marginTop: number;        // Top margin in pixels
  marginBottom: number;     // Bottom margin in pixels
  marginLeft: number;       // Left margin in pixels
  marginRight: number;      // Right margin in pixels
}

// Canvas specifications for different product types and sizes
export const CANVAS_SPECS: Record<string, Record<string, ProductCanvasSpecs>> = {
  [ProductType.ART_PRINT]: {
    '12x18': {
      printAreaWidth: 3600,   // 12" at 300 DPI
      printAreaHeight: 5400,  // 18" at 300 DPI
      marginTop: 150,
      marginBottom: 150,
      marginLeft: 150,
      marginRight: 150
    },
    '16x20': {
      printAreaWidth: 4800,   // 16" at 300 DPI
      printAreaHeight: 6000,  // 20" at 300 DPI
      marginTop: 200,
      marginBottom: 200,
      marginLeft: 200,
      marginRight: 200
    },
    '18x24': {
      printAreaWidth: 5400,   // 18" at 300 DPI
      printAreaHeight: 7200,  // 24" at 300 DPI
      marginTop: 250,
      marginBottom: 250,
      marginLeft: 250,
      marginRight: 250
    }
  },
  [ProductType.CANVAS_FRAMED]: {
    '12x16': {
      printAreaWidth: 3600,   // 12" at 300 DPI
      printAreaHeight: 4800,  // 16" at 300 DPI
      marginTop: 300,         // Larger margins for frame
      marginBottom: 300,
      marginLeft: 300,
      marginRight: 300
    },
    '16x20': {
      printAreaWidth: 4800,   // 16" at 300 DPI
      printAreaHeight: 6000,  // 20" at 300 DPI
      marginTop: 400,
      marginBottom: 400,
      marginLeft: 400,
      marginRight: 400
    },
    '20x24': {
      printAreaWidth: 6000,   // 20" at 300 DPI
      printAreaHeight: 7200,  // 24" at 300 DPI
      marginTop: 500,
      marginBottom: 500,
      marginLeft: 500,
      marginRight: 500
    }
  }
};

// Calculate optimal image placement for a product
export function calculateImagePlacement(
  productType: ProductType,
  size: string,
  imageUrl: string,
  imageDimensions?: ImageDimensions
): PrintifyImagePlacement {
  
  // Default placement (center, no scaling)
  const defaultPlacement: PrintifyImagePlacement = {
    x: 0.5,
    y: 0.5,
    scale: 1.0,
    angle: 0
  };

  // Get canvas specifications
  const canvasSpec = CANVAS_SPECS[productType]?.[size];
  if (!canvasSpec) {
    console.warn(`No canvas specs found for ${productType} size ${size}, using default placement`);
    return defaultPlacement;
  }

  // If we don't have image dimensions, use default placement
  if (!imageDimensions) {
    return defaultPlacement;
  }

  // Calculate available print area (excluding margins)
  const availableWidth = canvasSpec.printAreaWidth - canvasSpec.marginLeft - canvasSpec.marginRight;
  const availableHeight = canvasSpec.printAreaHeight - canvasSpec.marginTop - canvasSpec.marginBottom;

  // Calculate scale to fit image within available area while maintaining aspect ratio
  const scaleX = availableWidth / imageDimensions.width;
  const scaleY = availableHeight / imageDimensions.height;
  const scale = Math.min(scaleX, scaleY, 1.0); // Don't upscale beyond original size

  // For portrait images (like Mona Lisa), we might want to optimize positioning
  const imageAspectRatio = imageDimensions.width / imageDimensions.height;
  const canvasAspectRatio = canvasSpec.printAreaWidth / canvasSpec.printAreaHeight;

  let x = 0.5; // Default center
  let y = 0.5; // Default center

  // Adjust positioning based on product type and image characteristics
  if (productType === ProductType.ART_PRINT) {
    // For art prints, center the image but slightly favor upper placement for portraits
    if (imageAspectRatio < 1) { // Portrait orientation
      y = 0.45; // Slightly higher than center
    }
  } else if (productType === ProductType.CANVAS_FRAMED) {
    // For framed canvas, account for frame and matting
    // Keep centered but ensure adequate border
    x = 0.5;
    y = 0.5;
  }

  return {
    x,
    y,
    scale: Math.max(scale, 0.1), // Minimum scale of 10%
    angle: 0
  };
}

// Get image dimensions from URL (placeholder - would need actual implementation)
export async function getImageDimensions(imageUrl: string): Promise<ImageDimensions | null> {
  try {
    // This would typically use a service to get image metadata
    // For now, return null to use default placement
    // In production, you could:
    // 1. Use a service like Cloudinary to get image info
    // 2. Store dimensions when images are generated
    // 3. Use a separate API endpoint to analyze images
    
    console.log(`Getting dimensions for image: ${imageUrl}`);
    return null;
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    return null;
  }
}

// Enhanced image placement with face detection optimization
export function calculateFaceOptimizedPlacement(
  productType: ProductType,
  size: string,
  imageUrl: string,
  imageDimensions?: ImageDimensions,
  faceBox?: { x: number; y: number; width: number; height: number }
): PrintifyImagePlacement {
  
  const basePlacement = calculateImagePlacement(productType, size, imageUrl, imageDimensions);
  
  // If no face detected, use base placement
  if (!faceBox || !imageDimensions) {
    return basePlacement;
  }

  // Calculate face center relative to image
  const faceCenterX = (faceBox.x + faceBox.width / 2) / imageDimensions.width;
  const faceCenterY = (faceBox.y + faceBox.height / 2) / imageDimensions.height;

  // For portrait-style products, try to center the face in the upper portion
  if (productType === ProductType.ART_PRINT || productType === ProductType.CANVAS_FRAMED) {
    // Adjust positioning to center the face in the "rule of thirds" upper area
    const targetY = 0.35; // Upper third position
    const targetX = 0.5;  // Center horizontally

    // Calculate offset needed to position face at target
    const offsetX = targetX - faceCenterX * basePlacement.scale;
    const offsetY = targetY - faceCenterY * basePlacement.scale;

    // Apply constraints to keep image within bounds
    const constrainedX = Math.max(0.1, Math.min(0.9, basePlacement.x + offsetX));
    const constrainedY = Math.max(0.1, Math.min(0.9, basePlacement.y + offsetY));

    return {
      ...basePlacement,
      x: constrainedX,
      y: constrainedY
    };
  }

  return basePlacement;
}

// Validate placement values
export function validatePlacement(placement: PrintifyImagePlacement): PrintifyImagePlacement {
  return {
    x: Math.max(0, Math.min(1, placement.x)),
    y: Math.max(0, Math.min(1, placement.y)),
    scale: Math.max(0.1, Math.min(5, placement.scale)),
    angle: placement.angle % 360
  };
}

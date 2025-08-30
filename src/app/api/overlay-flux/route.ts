import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { detectFaceBox } from "@/lib/server/faceDetect";
import { fal } from "@fal-ai/client";

// Force Node runtime on Vercel (not Edge)
export const runtime = "nodejs";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

type Fit = "width" | "height";

interface OverlayFluxRequest {
  monaUrl: string;
  headUrl: string;
  fit?: Fit;
  scale?: number;
  fluxPrompt?: string;
  fluxStrength?: number;
  fluxGuidanceScale?: number;
  fluxSteps?: number;
  skipFlux?: boolean;
}

async function fetchBuf(url: string) {
  // Handle local file paths by converting to full URL
  if (url.startsWith('/')) {
    url = `http://localhost:3000${url}`;
  }
  console.log("🌐 Fetching from URL:", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed: ${url} ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export async function POST(req: NextRequest) {
  console.log("🔥 /api/overlay-flux POST request received");
  
  try {
    const body: OverlayFluxRequest = await req.json();
    console.log("📋 Request body:", body);
    
    const { 
      monaUrl, 
      headUrl, 
      fit = "width", 
      scale = 1.0,
      fluxPrompt,
      fluxStrength = 0.8,
      fluxGuidanceScale = 7.5,
      fluxSteps = 28,
      skipFlux = false
    } = body;

    console.log("🔍 Parsed parameters:", { 
      monaUrl, headUrl, fit, scale, 
      fluxPrompt, fluxStrength, fluxGuidanceScale, fluxSteps, skipFlux 
    });

    if (!monaUrl || !headUrl) {
      console.error("❌ Missing required parameters");
      return NextResponse.json({ error: "monaUrl and headUrl are required" }, { status: 400 });
    }

    // STEP 1: Create overlay composite (existing logic)
    console.log("📥 Loading images...");
    const [monaBuf, headBuf] = await Promise.all([fetchBuf(monaUrl), fetchBuf(headUrl)]);
    console.log("✅ Images loaded - Mona:", monaBuf.length, "bytes, Head:", headBuf.length, "bytes");

    // Face detection
    console.log("🔍 Detecting faces...");
    const [monaFace, headFace] = await Promise.all([detectFaceBox(monaBuf), detectFaceBox(headBuf)]);
    console.log("✅ Face detection complete - Mona face:", monaFace, "Head face:", headFace);

    // Crop headshot to face+hair with 20px buffer
    const buffer = 20;
    const cropX = Math.max(0, headFace.x - buffer);
    const cropY = Math.max(0, headFace.y - buffer);
    const cropW = Math.min(headFace.iw - cropX, headFace.w + (2 * buffer));
    const cropH = Math.min(headFace.ih - cropY, headFace.h + (2 * buffer));
    
    console.log("✂️ Cropping headshot - Original:", headFace.iw, "x", headFace.ih, "Crop:", cropX, cropY, cropW, cropH);
    const croppedHeadBuf = await sharp(headBuf)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .toBuffer();
    console.log("✅ Headshot cropped to face+hair, size:", croppedHeadBuf.length, "bytes");

    // Compute scale and position
    const sNumerator = fit === "height" ? monaFace.h : monaFace.w;
    const sDenominator = fit === "height" ? cropH : cropW;
    const s = Math.max(1e-6, (sNumerator / sDenominator) * (scale ?? 1.0));

    const mCx = monaFace.x + monaFace.w / 2;
    const mCy = monaFace.y + monaFace.h / 2;
    
    const croppedFaceCenterX = (headFace.x - cropX) + headFace.w / 2;
    const croppedFaceCenterY = (headFace.y - cropY) + headFace.h / 2;

    const scaledCropW = Math.max(1, Math.round(cropW * s));
    const scaledCropH = Math.max(1, Math.round(cropH * s));
    const left = Math.round(mCx - (croppedFaceCenterX * s));
    const top = Math.round(mCy - (croppedFaceCenterY * s));

    // Create overlay composite
    console.log("🖼️ Compositing cropped face - Scale:", s, "Scaled crop size:", scaledCropW, "x", scaledCropH, "Position:", left, top);
    const overlay = await sharp(croppedHeadBuf).ensureAlpha().resize(scaledCropW, scaledCropH, { fit: "fill", kernel: "lanczos3" }).toBuffer();
    console.log("✅ Overlay resized:", overlay.length, "bytes");
    
    const overlayComposite = await sharp(monaBuf)
      .ensureAlpha()
      .composite([{ input: overlay, left, top }])
      .png()
      .toBuffer();
    console.log("✅ Overlay composite created:", overlayComposite.length, "bytes");

    // STEP 2: Apply Flux transformation (if requested)
    let finalOutput = overlayComposite;
    
    if (!skipFlux && fluxPrompt) {
      console.log("🎨 Applying Flux transformation...");
      
      try {
        // Upload composite to fal storage
        console.log("☁️ Uploading composite to fal storage...");
        const compositeFile = new File([overlayComposite], 'overlay-composite.png', { type: 'image/png' });
        const compositeUrl = await fal.storage.upload(compositeFile);
        console.log("✅ Composite uploaded:", compositeUrl);

        // Run Flux transformation
        console.log("🎨 Running Flux LoRA transformation with prompt:", fluxPrompt);
        const fluxResult = await fal.subscribe('fal-ai/flux-kontext-lora', {
          input: {
            image_url: compositeUrl,
            prompt: fluxPrompt,
            guidance_scale: fluxGuidanceScale,
            num_inference_steps: fluxSteps,
            seed: Math.floor(Math.random() * 1000000)
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              console.log("⏳ Flux processing:", update.status);
              if (update.logs) {
                update.logs.forEach(log => console.log("📝 Flux log:", log.message));
              }
            }
          }
        });

        if (fluxResult.data && fluxResult.data.images && fluxResult.data.images[0]) {
          const fluxImageUrl = fluxResult.data.images[0].url;
          console.log("🖼️ Flux generated image URL:", fluxImageUrl);

          // Download the Flux result
          console.log("📥 Downloading Flux result...");
          const fluxResponse = await fetch(fluxImageUrl);
          if (fluxResponse.ok) {
            finalOutput = Buffer.from(await fluxResponse.arrayBuffer());
            console.log("✅ Flux transformation applied, final size:", finalOutput.length, "bytes");
          } else {
            console.warn("⚠️ Failed to download Flux result, using overlay composite");
          }
        } else {
          console.warn("⚠️ No Flux result generated, using overlay composite");
        }
      } catch (fluxError: any) {
        console.warn("⚠️ Flux transformation failed, using overlay composite:", fluxError.message);
        // Continue with overlay composite as fallback
      }
    } else {
      console.log("⏭️ Skipping Flux transformation (skipFlux=true or no prompt provided)");
    }

    // Return final result
    console.log("📤 Returning final result");
    return new NextResponse(finalOutput, {
      status: 200,
      headers: { 
        "Content-Type": "image/png", 
        "Cache-Control": "no-store",
        "X-Processing-Steps": skipFlux || !fluxPrompt ? "overlay-only" : "overlay-flux"
      },
    });

  } catch (error: any) {
    console.error("💥 API Error:", error);
    console.error("💥 Error stack:", error?.stack);
    
    let errorMessage = error?.message || "Unknown error";
    let statusCode = 500;
    
    if (error?.message?.includes('credentials') || error?.message?.includes('unauthorized')) {
      errorMessage = "Invalid API credentials. Please check FAL_KEY or HF_TOKEN environment variable.";
      statusCode = 401;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: statusCode });
  }
}

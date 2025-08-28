import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { detectFaceBox } from "@/lib/server/faceDetect";

// Force Node runtime on Vercel (not Edge)
export const runtime = "nodejs";

type Fit = "width" | "height";

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
  console.log("🔥 /api/overlay POST request received");
  
  try {
    const body = await req.json();
    console.log("📋 Request body:", body);
    
    const { monaUrl, headUrl, fit = "width", scale = 1.0 }: { monaUrl: string; headUrl: string; fit?: Fit; scale?: number } = body;

    console.log("🔍 Parsed parameters:", { monaUrl, headUrl, fit, scale });

    if (!monaUrl || !headUrl) {
      console.error("❌ Missing required parameters");
      return NextResponse.json({ error: "monaUrl and headUrl are required" }, { status: 400 });
    }

    // 1) Load images
    console.log("📥 Loading images...");
    const [monaBuf, headBuf] = await Promise.all([fetchBuf(monaUrl), fetchBuf(headUrl)]);
    console.log("✅ Images loaded - Mona:", monaBuf.length, "bytes, Head:", headBuf.length, "bytes");

    // 2) Detect faces (Mona + headshot)
    console.log("🔍 Detecting faces...");
    const [monaFace, headFace] = await Promise.all([detectFaceBox(monaBuf), detectFaceBox(headBuf)]);
    console.log("✅ Face detection complete - Mona face:", monaFace, "Head face:", headFace);

    // 3) Crop headshot to face+hair with 20px buffer
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

    // 4) Compute scale so cropped head matches Mona face (width or height)
    const sNumerator = fit === "height" ? monaFace.h : monaFace.w;
    const sDenominator = fit === "height" ? cropH : cropW;
    const s = Math.max(1e-6, (sNumerator / sDenominator) * (scale ?? 1.0));

    // 5) Compute paste origin so centers coincide
    const mCx = monaFace.x + monaFace.w / 2;
    const mCy = monaFace.y + monaFace.h / 2;
    
    // Adjust for cropped coordinates - face center relative to cropped image
    const croppedFaceCenterX = (headFace.x - cropX) + headFace.w / 2;
    const croppedFaceCenterY = (headFace.y - cropY) + headFace.h / 2;

    const scaledCropW = Math.max(1, Math.round(cropW * s));
    const scaledCropH = Math.max(1, Math.round(cropH * s));
    const left = Math.round(mCx - (croppedFaceCenterX * s));
    const top = Math.round(mCy - (croppedFaceCenterY * s));

    // 6) Resize cropped overlay & composite
    console.log("🖼️ Compositing cropped face - Scale:", s, "Scaled crop size:", scaledCropW, "x", scaledCropH, "Position:", left, top);
    const overlay = await sharp(croppedHeadBuf).ensureAlpha().resize(scaledCropW, scaledCropH, { fit: "fill", kernel: "lanczos3" }).toBuffer();
    console.log("✅ Overlay resized:", overlay.length, "bytes");
    
    const out = await sharp(monaBuf)
      .ensureAlpha()
      .composite([{ input: overlay, left, top }])
      .png()
      .toBuffer();
    console.log("✅ Final composite created:", out.length, "bytes");

    // 6) Return PNG buffer (pipeline-ready)
    console.log("📤 Returning PNG response");
    return new NextResponse(out, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("💥 API Error:", e);
    console.error("💥 Error stack:", e?.stack);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

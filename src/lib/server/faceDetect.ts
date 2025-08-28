import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import sharp from "sharp";

let detector: FaceDetector | null = null;

interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
  iw: number;
  ih: number;
}

async function getDetector(): Promise<FaceDetector> {
  if (detector) return detector;
  
  console.log("🔧 Initializing MediaPipe Face Detector...");
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  
  detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      delegate: "CPU"
    },
    runningMode: "IMAGE"
  });
  
  console.log("✅ MediaPipe Face Detector initialized");
  return detector;
}

function fallbackCenteredBox(iw: number, ih: number): FaceBox {
  console.log("⚠️ Using fallback centered box");
  return {
    x: Math.round(iw * 0.25),
    y: Math.round(ih * 0.2),
    w: Math.round(iw * 0.5),
    h: Math.round(ih * 0.6),
    iw,
    ih,
  };
}

export async function detectFaceBox(buf: Buffer): Promise<FaceBox> {
  console.log("🔍 Starting face detection on buffer of size:", buf.length);
  
  try {
    // Convert buffer to ImageData-like object
    const { data, info } = await sharp(buf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const img = {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height,
      iw: info.width,
      ih: info.height,
    };

    console.log("📐 Image dimensions:", img.width, "x", img.height);

    const detector = await getDetector();
    const result = await detector.detect(img as any);
    const dets = result?.detections ?? [];
    
    console.log("🎯 Detected", dets.length, "faces");
    
    if (!dets.length) return fallbackCenteredBox(img.iw, img.ih);

    // Pick the largest face
    let best = dets[0];
    let bestArea = 0;
    for (const d of dets) {
      const b = d.boundingBox;
      if (b) {
        const area = b.width * b.height;
        if (area > bestArea) {
          best = d;
          bestArea = area;
        }
      }
    }
    
    const b = best.boundingBox;
    if (!b) {
      return fallbackCenteredBox(img.iw, img.ih);
    }
    
    const faceBox = {
      x: Math.round(b.originX),
      y: Math.round(b.originY),
      w: Math.round(b.width),
      h: Math.round(b.height),
      iw: img.iw,
      ih: img.ih,
    };
    
    console.log("✅ Face detected:", faceBox);
    return faceBox;
    
  } catch (error) {
    console.error("💥 Face detection failed:", error);
    // If MediaPipe fails to init (e.g., cold start or WASM fetch issue), use fallback
    const meta = await sharp(buf).metadata();
    const iw = meta.width || 1024;
    const ih = meta.height || 1024;
    return fallbackCenteredBox(iw, ih);
  }
}

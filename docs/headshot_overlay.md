---
title: "Headshot Overlay"
date: 2025-08-28
author: "Cascade"
version: "v0.1.0"
status: "tested"
---

# Overview
Automates compositing of a user headshot onto the Mona Lisa. Detects faces in both images, crops the headshot to face+hair with a 20px buffer, scales to match Mona’s face, and returns a PNG buffer.

# Architecture
- Backend-only Next.js API route at `src/app/api/overlay/route.ts` (Node runtime) using `sharp`.
- Face detection in `src/lib/server/faceDetect.ts` via MediaPipe Tasks Vision (WASM).
- Static assets served from `public/images/` (e.g., `public/images/monalisa.png`).
- Test UI at `src/app/test-overlay/page.tsx` with `src/components/common/OverlayTester.tsx`.

# Key Decisions
- Use MediaPipe face detection for dynamic bounding boxes instead of hardcoded regions.
- Crop headshot to detected face plus 20px buffer to include hair for better realism.
- Align and scale by matching face bounding boxes between headshot and Mona.
- Add verbose debugging logs to simplify troubleshooting (fetching, detection, crop, scale, composite).

# Usage & API
Endpoint: `POST /api/overlay`

Request body JSON:
```json
{
  "monaUrl": "/images/monalisa.png",
  "headUrl": "/images/test headshots/Screenshot_2.jpg",
  "fit": "width",  
  "scale": 1.0     
}
```

Notes:
- Relative URLs are converted to absolute (`http://localhost:3000/...`) inside the handler for local testing.
- Returns `image/png` buffer.

Frontend testing:
- Navigate to `/test-overlay` and select a headshot from `public/images/test headshots/` to generate and preview the composite.

# Dependencies
- `sharp` for image processing.
- `@mediapipe/tasks-vision` (MediaPipe Tasks Vision) for face detection.
- Next.js API routes (Node runtime).

# Test Coverage
- Manual E2E tests via `/test-overlay` page with multiple local headshots.
- Logs confirm detection on both images, crop with 20px buffer, scaling, and compositing.
- Future work: add Jest tests (frontend) and integration tests for API using mock images.

# Changelog
- 2025-08-28 (Cascade) v0.1.0 — Initial implementation, added cropping buffer, overlay tester UI, and docs. Status → tested.

# Objective

Automate compositing of user headshots onto the Mona Lisa by detecting both faces, scaling the headshot so its face matches Mona’s, and returning a PNG buffer for downstream API steps.

# Scope

Runs entirely in the Next.js backend (Node runtime).

Face detection implemented in src/lib/server/faceDetect.ts using MediaPipe Face Detector (WASM models).

Image compositing implemented in src/app/api/overlay/route.ts using sharp.

Includes fallback logic if detection fails.

Output integrates into a multi-step backend image pipeline (final PNG passed to another API).

# Inputs

monaUrl (string) → Mona Lisa image source.

headUrl (string) → User headshot image source.

Optional params:

fit: "width" or "height" (default: width).

scale: float multiplier for tighter/looser fit.

# Process Flow

Fetch images from URLs (inside route.ts).

Face detection (faceDetect.ts):

Runs MediaPipe FaceDetector (WASM) on Mona + headshot.

If no face detected → fallback to heuristic centered box.

Scaling & alignment (route.ts):

Compute scale so headshot face width/height matches Mona’s.

Compute paste coordinates to align face centers.

Compositing (route.ts):

Resize full headshot with sharp.

Paste onto Mona at computed coordinates.

Output (route.ts):

Return composited PNG buffer in HTTP response.

Ready to be sent to next API in pipeline.

# Outcomes / Success Criteria

Consistent placement: Every headshot aligns to Mona’s face without manual adjustment.

Backend-only: Runs fully in Node.js (no Python, no native OpenCV).

Resilient: Graceful fallbacks ensure an output is always produced.

Integratable: API returns binary PNG buffer (or can be adapted to return storage URL) ready for the next pipeline stage.

# Non-Goals

No advanced facial warping, rotation, or style transfer.

No client-side detection (all detection is in faceDetect.ts on the backend).

No persistence beyond passing output to the next pipeline stage.
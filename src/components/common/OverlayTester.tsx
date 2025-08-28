// src/components/common/OverlayTester.tsx
"use client";

import { useState } from "react";

const TEST_HEADSHOTS = [
  "/images/test headshots/Screen Shot 2023-11-30 at 11.48.13 AM.png",
  "/images/test headshots/Screenshot_2.jpg", 
  "/images/test headshots/Screenshot_20230913-173152.png",
  "/images/test headshots/image_50438145 (1).JPG"
];

export const OverlayTester = () => {
  const [selectedHeadshot, setSelectedHeadshot] = useState<string>(TEST_HEADSHOTS[0]);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOverlay = async (headUrl: string) => {
    console.log("🚀 generateOverlay called with:", headUrl);
    
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("📤 Making fetch request to /api/overlay");
      console.log("📋 Request payload:", {
        monaUrl: "/images/monalisa.png",
        headUrl: headUrl,
        fit: "width",
        scale: 1.0
      });
      
      const res = await fetch("/api/overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monaUrl: "/images/monalisa.png",
          headUrl: headUrl,
          fit: "width",
          scale: 1.0
        })
      });

      console.log("📥 Response received - Status:", res.status);
      console.log("📥 Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`Overlay generation failed: ${res.status} - ${errorText}`);
      }

      const pngBlob = await res.blob();
      console.log("✅ Generated blob size:", pngBlob.size, "bytes");
      console.log("✅ Blob type:", pngBlob.type);
      
      // Create object URL for display
      const overlayUrl = URL.createObjectURL(pngBlob);
      console.log("🖼️ Created object URL:", overlayUrl);
      setOverlayImage(overlayUrl);
      
      // Also create download link
      const link = document.createElement('a');
      link.href = overlayUrl;
      link.download = `overlay-${Date.now()}.png`;
      document.body.appendChild(link);
      console.log("💾 Triggering download...");
      link.click();
      document.body.removeChild(link);
      console.log("✅ Download triggered successfully");
      
    } catch (error) {
      console.error("💥 Overlay generation error:", error);
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      console.log("🏁 Setting isGenerating to false");
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Overlay Composition Tester</h2>
      
      {/* Test Headshot Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Test Headshot:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEST_HEADSHOTS.map((headshot, index) => (
            <div key={index} className="text-center">
              <img 
                src={headshot} 
                alt={`Test headshot ${index + 1}`}
                className={`w-24 h-24 object-cover rounded cursor-pointer border-2 ${
                  selectedHeadshot === headshot ? 'border-blue-500' : 'border-gray-300'
                }`}
                onClick={() => setSelectedHeadshot(headshot)}
              />
              <p className="text-xs mt-1">Test {index + 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button 
          onClick={() => generateOverlay(selectedHeadshot)}
          disabled={isGenerating}
          className="btn btn-primary"
        >
          {isGenerating ? "Generating..." : "Generate Overlay"}
        </button>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center mb-6">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-2">Processing images...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-6">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Result Display */}
      {overlayImage && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Generated Overlay (Auto-downloaded)</h3>
          <img 
            src={overlayImage} 
            alt="Generated overlay" 
            className="max-w-md mx-auto rounded-lg shadow-lg"
          />
          <p className="text-sm text-gray-600 mt-2">
            The image was automatically downloaded to your Downloads folder
          </p>
        </div>
      )}
    </div>
  );
};

// src/components/common/ImageUploader.tsx
"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

interface UploadedFile {
  url: string;
  name: string;
}

export const ImageUploader = () => {
  const [recipientPhoto, setRecipientPhoto] = useState<UploadedFile | null>(null);
  const [petPhoto, setPetPhoto] = useState<UploadedFile | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateOverlay = async (headUrl: string) => {
    setIsGenerating(true);
    try {
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

      if (!res.ok) {
        throw new Error(`Overlay generation failed: ${res.status}`);
      }

      const pngBlob = await res.blob();
      const overlayUrl = URL.createObjectURL(pngBlob);
      setOverlayImage(overlayUrl);
    } catch (error) {
      console.error("Overlay generation error:", error);
      alert(`Overlay generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-start p-8 gap-4">
      <h2 className="text-xl font-semibold mb-2">Upload Your Photos</h2>
      
      <div className="flex gap-4">
        <div>
          <p className="text-center mb-2">Recipient's Photo</p>
          <UploadButton
            endpoint="petMomUploader"
            input={{ artworkId: "temp-id" }}
            onClientUploadComplete={(res) => {
              console.log("Recipient files: ", res);
              if (res?.[0]) {
                const file = { url: res[0].url, name: res[0].name };
                setRecipientPhoto(file);
                // Auto-generate overlay when recipient photo is uploaded
                generateOverlay(file.url);
              }
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
          {recipientPhoto && (
            <div className="mt-2 text-sm text-green-600">
              ✓ {recipientPhoto.name}
            </div>
          )}
        </div>

        <div>
          <p className="text-center mb-2">Pet's Photo</p>
          <UploadButton
            endpoint="petPhotoUploader"
            input={{ customerName: "Test User", customerEmail: "test@example.com", petName: "Test Pet" }}
            onClientUploadComplete={(res) => {
              console.log("Pet files: ", res);
              if (res?.[0]) {
                setPetPhoto({ url: res[0].url, name: res[0].name });
              }
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
          {petPhoto && (
            <div className="mt-2 text-sm text-green-600">
              ✓ {petPhoto.name}
            </div>
          )}
        </div>
      </div>

      {/* Overlay Preview */}
      {isGenerating && (
        <div className="mt-6 text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-2">Generating overlay...</p>
        </div>
      )}

      {overlayImage && (
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Generated Overlay</h3>
          <img 
            src={overlayImage} 
            alt="Generated overlay" 
            className="max-w-md rounded-lg shadow-lg"
          />
          <button 
            onClick={() => generateOverlay(recipientPhoto!.url)}
            className="btn btn-secondary mt-2"
            disabled={!recipientPhoto || isGenerating}
          >
            Regenerate
          </button>
        </div>
      )}
    </main>
  );
};

// src/components/common/ImageUploader.tsx
"use client";

import { UploadButton } from "@/lib/uploadthing";

export const ImageUploader = () => {
  return (
    <main className="flex flex-col items-center justify-start p-8 gap-4">
      <h2 className="text-xl font-semibold mb-2">Upload Your Photos</h2>
      <div className="flex gap-4">
        <div>
            <p className="text-center mb-2">Recipient's Photo</p>
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                alert("Upload Completed");
                }}
                onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
                }}
            />
        </div>
        <div>
            <p className="text-center mb-2">Pet's Photo</p>
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                alert("Upload Completed");
                }}
                onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
                }}
            />
        </div>
      </div>
    </main>
  );
};

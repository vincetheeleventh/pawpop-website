'use client';

import { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';

interface ImageUploadZoneProps {
  sessionToken: string;
  onUploadComplete: (imageUrl: string, artworkId: string) => void;
  onError: (error: string) => void;
}

export default function ImageUploadZone({ 
  sessionToken, 
  onUploadComplete,
  onError 
}: ImageUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [email, setEmail] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!email) {
      onError('Please enter your email first!');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('Image must be smaller than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionToken', sessionToken);
      formData.append('email', email);

      // Upload to our API
      const response = await fetch('/api/shtuu/dialogue/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.success) {
        onUploadComplete(data.imageUrl, data.artworkId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-card-surface border-2 border-naples-yellow rounded-2xl p-6 space-y-4">
      {/* Email input */}
      <div>
        <label className="block font-geist text-sm font-medium text-text-primary mb-2">
          Your Email
          <span className="text-cyclamen ml-1">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 border-2 border-naples-yellow rounded-xl font-geist focus:outline-none focus:border-cyclamen transition-colors"
          disabled={isUploading}
          required
        />
        <p className="text-xs text-text-primary/60 mt-1">
          So Shtuu can send you the artwork!
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-cyclamen bg-cyclamen/10' 
            : 'border-naples-yellow hover:border-cyclamen/50 hover:bg-site-bg/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-48 mx-auto rounded-lg"
            />
            {isUploading && (
              <p className="font-geist text-cyclamen animate-pulse">
                Sending to Shtuu's studio...
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {dragActive ? (
                <Upload className="w-12 h-12 text-cyclamen" />
              ) : (
                <Camera className="w-12 h-12 text-naples-yellow" />
              )}
            </div>
            <p className="font-geist text-lg text-text-primary mb-2">
              {dragActive ? 'Drop your photo here!' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-text-primary/60">
              JPEG, PNG or WebP (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Tip */}
      <div className="bg-pale-azure/10 border border-pale-azure/30 rounded-lg p-3">
        <p className="text-sm text-text-primary/70 font-geist">
          💡 <strong>Tip:</strong> Use a clear photo where your pet's face is visible and well-lit!
        </p>
      </div>
    </div>
  );
}

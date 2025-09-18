// src/app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Pet photo uploader for artwork generation
  petPhotoUploader: f({ 
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 }
  })
    .input(z.object({
      petName: z.string().optional(),
      customerName: z.string(),
      customerEmail: z.string().email()
    }))
    .middleware(async ({ input }) => {
      return { 
        petName: input.petName,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        uploadedAt: new Date().toISOString()
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Pet photo upload complete:", {
        url: file.url,
        name: file.name,
        size: file.size,
        customerEmail: metadata.customerEmail
      });

      return { 
        url: file.url,
        name: file.name,
        size: file.size,
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        petName: metadata.petName
      };
    }),

  // Pet mom photo uploader (for the 2-step process)
  petMomUploader: f({ 
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 }
  })
    .input(z.object({
      artworkId: z.string().uuid()
    }))
    .middleware(async ({ input }) => {
      return { 
        artworkId: input.artworkId,
        uploadedAt: new Date().toISOString()
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Pet mom photo upload complete:", {
        url: file.url,
        artworkId: metadata.artworkId
      });

      return { 
        url: file.url,
        artworkId: metadata.artworkId
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

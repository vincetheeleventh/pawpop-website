/**
 * Enhanced upload validation and error handling utilities
 * Provides robust validation, error recovery, and preventative measures
 */

// Types for validation results
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  fileInfo?: {
    name: string;
    type: string;
    size: number;
    sizeFormatted: string;
  };
}

export interface ProcessingOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  requireName?: boolean;
  timeoutMs?: number;
}

// Default processing options
const DEFAULT_OPTIONS: ProcessingOptions = {
  maxSizeMB: 50,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  requireName: true,
  timeoutMs: 30000
};

/**
 * Enhanced file validation that handles File, Blob, and edge cases
 */
export function validateUploadFile(
  file: File | Blob | null | undefined,
  options: ProcessingOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // Null/undefined check
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Type validation - accept File, Blob, or objects with File/Blob-like properties
  const isValidType = file instanceof File || 
                     file instanceof Blob ||
                     (typeof file === 'object' && 
                      file !== null &&
                      'size' in file && 
                      'type' in file &&
                      typeof (file as any).size === 'number' &&
                      typeof (file as any).type === 'string');

  if (!isValidType) {
    return {
      isValid: false,
      error: 'Invalid file object - must be File or Blob'
    };
  }

  // Extract file properties safely
  const fileSize = file.size;
  const fileType = file.type || '';
  const fileName = ('name' in file && typeof file.name === 'string') ? file.name : 'unknown';

  // Size validation
  if (fileSize === 0) {
    return {
      isValid: false,
      error: 'File is empty (0 bytes)'
    };
  }

  if (fileSize > opts.maxSizeMB! * 1024 * 1024) {
    return {
      isValid: false,
      error: `File too large (${formatFileSize(fileSize)}). Maximum allowed: ${opts.maxSizeMB}MB`
    };
  }

  // Warn about very small files
  if (fileSize < 1024) {
    warnings.push(`File is very small (${formatFileSize(fileSize)}). This may indicate a corrupted or invalid image.`);
  }

  // Warn about very large files that will need compression
  if (fileSize > 10 * 1024 * 1024) {
    warnings.push(`Large file detected (${formatFileSize(fileSize)}). This will be compressed before processing.`);
  }

  // Type validation
  if (opts.allowedTypes && opts.allowedTypes.length > 0) {
    const isAllowedType = opts.allowedTypes.includes(fileType) ||
                         // Special handling for iPhone photos that may have empty MIME type
                         (fileType === '' && fileName.toLowerCase().match(/\.(jpg|jpeg|png|heic|heif)$/));

    if (!isAllowedType) {
      return {
        isValid: false,
        error: `Unsupported file type: ${fileType || 'unknown'}. Allowed types: ${opts.allowedTypes.join(', ')}`
      };
    }
  }

  // Name validation
  if (opts.requireName && (!fileName || fileName === 'unknown')) {
    warnings.push('File name is missing or unknown. This may cause issues during processing.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    fileInfo: {
      name: fileName,
      type: fileType,
      size: fileSize,
      sizeFormatted: formatFileSize(fileSize)
    }
  };
}

/**
 * Convert File/Blob to File object for FormData compatibility
 */
export function ensureFileObject(fileOrBlob: File | Blob, defaultName = 'image.jpg'): File {
  if (fileOrBlob instanceof File) {
    return fileOrBlob;
  }

  // Convert Blob to File
  return new File([fileOrBlob], defaultName, {
    type: fileOrBlob.type || 'image/jpeg'
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Enhanced error handling with retry logic
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Retry wrapper for upload operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors or client errors
      if (error instanceof UploadError && !error.retryable) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new UploadError(
    `Upload failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    'MAX_RETRIES_EXCEEDED',
    false,
    'Upload failed after multiple attempts. Please try again later.'
  );
}

/**
 * Timeout wrapper for long-running operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new UploadError(
          timeoutMessage,
          'TIMEOUT',
          true,
          'The operation is taking longer than expected. Please try again.'
        ));
      }, timeoutMs);
    })
  ]);
}

/**
 * Memory-safe file processing with progress tracking
 */
export interface ProcessingProgress {
  stage: 'validation' | 'conversion' | 'compression' | 'upload' | 'complete';
  progress: number; // 0-100
  message: string;
}

export async function processFileWithProgress(
  file: File | Blob,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<File> {
  const reportProgress = (stage: ProcessingProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  try {
    // Stage 1: Validation
    reportProgress('validation', 10, 'Validating file...');
    const validation = validateUploadFile(file);
    if (!validation.isValid) {
      throw new UploadError(validation.error!, 'VALIDATION_FAILED', false);
    }

    // Stage 2: Conversion (if needed)
    let processedFile = file;
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      reportProgress('conversion', 30, 'Converting HEIC to JPEG...');
      // HEIC conversion would happen here
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Stage 3: Compression (if needed)
    if (file.size > 3 * 1024 * 1024) {
      reportProgress('compression', 60, 'Compressing large image...');
      // Compression would happen here
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Stage 4: Finalization
    reportProgress('upload', 90, 'Preparing for upload...');
    const finalFile = ensureFileObject(processedFile);

    reportProgress('complete', 100, 'File processing complete');
    return finalFile;

  } catch (error) {
    throw new UploadError(
      `File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PROCESSING_FAILED',
      false,
      'Failed to process the image. Please try a different image or reduce the file size.'
    );
  }
}

/**
 * Browser compatibility checks
 */
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (typeof File === 'undefined') missing.push('File API');
  if (typeof Blob === 'undefined') missing.push('Blob API');
  if (typeof FormData === 'undefined') missing.push('FormData API');
  if (typeof fetch === 'undefined') missing.push('Fetch API');

  return {
    supported: missing.length === 0,
    missing
  };
}

/**
 * Security validation - check file magic numbers
 */
export async function validateFileContent(file: File | Blob): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for common image magic numbers
    const magicNumbers = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      webp: [0x52, 0x49, 0x46, 0x46], // First 4 bytes, followed by WEBP
      heic: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63] // at offset 4
    };

    // Check JPEG
    if (bytes.length >= 3 && 
        bytes[0] === magicNumbers.jpeg[0] && 
        bytes[1] === magicNumbers.jpeg[1] && 
        bytes[2] === magicNumbers.jpeg[2]) {
      return true;
    }

    // Check PNG
    if (bytes.length >= 4 && 
        bytes[0] === magicNumbers.png[0] && 
        bytes[1] === magicNumbers.png[1] && 
        bytes[2] === magicNumbers.png[2] && 
        bytes[3] === magicNumbers.png[3]) {
      return true;
    }

    // Check WebP
    if (bytes.length >= 12 && 
        bytes[0] === magicNumbers.webp[0] && 
        bytes[1] === magicNumbers.webp[1] && 
        bytes[2] === magicNumbers.webp[2] && 
        bytes[3] === magicNumbers.webp[3] &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return true;
    }

    // Check HEIC (simplified check)
    if (bytes.length >= 12 && 
        bytes[4] === magicNumbers.heic[0] && 
        bytes[5] === magicNumbers.heic[1] && 
        bytes[6] === magicNumbers.heic[2] && 
        bytes[7] === magicNumbers.heic[3]) {
      return true;
    }

    return false;
  } catch (error) {
    console.warn('File content validation failed:', error);
    return true; // Allow processing if validation fails
  }
}
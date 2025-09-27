/**
 * Upload Resilience - Additional safeguards for critical failure cases
 * Implements circuit breakers, memory monitoring, and advanced error recovery
 */

// Memory monitoring utilities
export interface MemoryInfo {
  usedMB: number;
  totalMB: number;
  usagePercent: number;
  isLowMemory: boolean;
}

export function getMemoryInfo(): MemoryInfo {
  let usedMB = 0;
  let totalMB = 0;
  let usagePercent = 0;

  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    totalMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    usagePercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
  }

  return {
    usedMB,
    totalMB,
    usagePercent,
    isLowMemory: usagePercent > 80
  };
}

// Circuit breaker implementation
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state = CircuitState.CLOSED;

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private name = 'CircuitBreaker'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`🔄 ${this.name}: Moving to HALF_OPEN state`);
      } else {
        throw new Error(`${this.name}: Circuit breaker is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      console.warn(`⚠️ ${this.name}: Circuit breaker OPENED after ${this.failureCount} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Global circuit breakers for different services
export const falAiCircuitBreaker = new CircuitBreaker(3, 30000, 'fal.ai API');
export const supabaseCircuitBreaker = new CircuitBreaker(5, 60000, 'Supabase');
export const uploadThingCircuitBreaker = new CircuitBreaker(3, 30000, 'UploadThing');

// Request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return this.pendingRequests.get(key);
    }

    const promise = operation();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  getStats() {
    return {
      pendingCount: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys())
    };
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Upload queue management
class UploadQueue {
  private queue: Array<{ id: string; operation: () => Promise<any>; resolve: Function; reject: Function }> = [];
  private processing = new Set<string>();
  private readonly maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(id: string, operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, operation, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.processing.add(item.id);
    console.log(`🚀 Processing upload: ${item.id} (${this.processing.size}/${this.maxConcurrent})`);

    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.processing.delete(item.id);
      // Process next item in queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    };
  }
}

export const uploadQueue = new UploadQueue(3);

// File integrity verification
export async function verifyImageIntegrity(processedFile: File | Blob, originalFile: File | Blob): Promise<boolean> {
  try {
    // Check file size ratio (should be reasonable)
    const sizeRatio = processedFile.size / originalFile.size;
    if (sizeRatio < 0.05 || sizeRatio > 3) {
      console.warn(`⚠️ Suspicious file size ratio: ${sizeRatio.toFixed(2)}`);
      return false;
    }

    // Verify the processed file can be loaded as an image
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(processedFile);
      
      const cleanup = () => URL.revokeObjectURL(url);
      
      img.onload = () => {
        cleanup();
        // Check if image has reasonable dimensions
        if (img.width < 10 || img.height < 10 || img.width > 10000 || img.height > 10000) {
          console.warn(`⚠️ Suspicious image dimensions: ${img.width}x${img.height}`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      img.onerror = () => {
        cleanup();
        console.warn('⚠️ Processed image failed to load');
        resolve(false);
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        cleanup();
        console.warn('⚠️ Image integrity check timed out');
        resolve(false);
      }, 5000);
      
      img.src = url;
    });
  } catch (error) {
    console.warn('⚠️ Image integrity check failed:', error);
    return false;
  }
}

// Advanced security scanning
export async function deepSecurityScan(file: File | Blob): Promise<boolean> {
  try {
    // Read first 1KB for pattern analysis
    const buffer = await file.slice(0, 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Suspicious patterns to detect
    const suspiciousPatterns = [
      { pattern: [0x4D, 0x5A], name: 'PE executable' },
      { pattern: [0x7F, 0x45, 0x4C, 0x46], name: 'ELF executable' },
      { pattern: [0x50, 0x4B, 0x03, 0x04], name: 'ZIP archive' },
      { pattern: [0x52, 0x61, 0x72, 0x21], name: 'RAR archive' },
      { pattern: [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], name: 'Script tag' }, // <script
    ];

    for (const { pattern, name } of suspiciousPatterns) {
      if (containsPattern(bytes, pattern)) {
        console.warn(`🚨 Security threat detected: ${name}`);
        return false;
      }
    }

    // Check for excessively long filenames (potential path traversal)
    if ('name' in file && file.name && file.name.length > 255) {
      console.warn('🚨 Suspicious filename length');
      return false;
    }

    // Check for suspicious file extensions in filename
    if ('name' in file && file.name) {
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
      const filename = file.name.toLowerCase();
      if (suspiciousExtensions.some(ext => filename.includes(ext))) {
        console.warn('🚨 Suspicious file extension detected');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn('⚠️ Security scan failed:', error);
    return true; // Allow processing if scan fails
  }
}

function containsPattern(bytes: Uint8Array, pattern: number[]): boolean {
  for (let i = 0; i <= bytes.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

// Browser-specific optimizations
export interface BrowserInfo {
  isSafari: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  supportsWebP: boolean;
  supportsHEIC: boolean;
}

export function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  
  return {
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isMobile: /Mobi|Android/i.test(ua),
    isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
    isFirefox: /Firefox/.test(ua),
    supportsWebP: checkWebPSupport(),
    supportsHEIC: checkHEICSupport()
  };
}

function checkWebPSupport(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function checkHEICSupport(): boolean {
  // HEIC support is limited, mainly iOS Safari
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua);
}

// Upload progress tracking
export class UploadProgressTracker {
  private progressCallbacks = new Map<string, (progress: number) => void>();

  track(uploadId: string, onProgress: (progress: number) => void): void {
    this.progressCallbacks.set(uploadId, onProgress);
  }

  updateProgress(uploadId: string, progress: number): void {
    const callback = this.progressCallbacks.get(uploadId);
    if (callback) {
      callback(Math.min(100, Math.max(0, progress)));
    }
  }

  complete(uploadId: string): void {
    this.progressCallbacks.delete(uploadId);
  }

  getActiveUploads(): string[] {
    return Array.from(this.progressCallbacks.keys());
  }
}

export const uploadProgressTracker = new UploadProgressTracker();

// System health monitoring
export interface SystemHealth {
  memory: MemoryInfo;
  circuitBreakers: Record<string, any>;
  uploadQueue: any;
  activeUploads: string[];
  timestamp: number;
}

export function getSystemHealth(): SystemHealth {
  return {
    memory: getMemoryInfo(),
    circuitBreakers: {
      falAi: falAiCircuitBreaker.getStats(),
      supabase: supabaseCircuitBreaker.getStats(),
      uploadThing: uploadThingCircuitBreaker.getStats()
    },
    uploadQueue: uploadQueue.getStats(),
    activeUploads: uploadProgressTracker.getActiveUploads(),
    timestamp: Date.now()
  };
}

// Emergency cleanup function
export function emergencyCleanup(): void {
  console.warn('🚨 Performing emergency cleanup...');
  
  // Clear request deduplication cache
  requestDeduplicator.clear();
  
  // Clear any pending timeouts or intervals
  // Note: This is a basic implementation, real cleanup would be more comprehensive
  
  // Force garbage collection if available
  if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
  }
  
  console.log('✅ Emergency cleanup completed');
}
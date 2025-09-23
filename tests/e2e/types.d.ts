// tests/e2e/types.d.ts

declare global {
  interface Window {
    plausibleEvents?: Array<{
      event: string;
      options?: {
        props?: Record<string, any>;
        revenue?: {
          currency: string;
          amount: number;
        };
      };
      timestamp: number;
      processingTime?: number;
    }>;
    
    plausibleMetrics?: {
      eventCount: number;
      totalProcessingTime: number;
      errors: Array<{
        event: string;
        error: string;
        timestamp: number;
      }>;
    };
    
    plausible?: (event: string, options?: {
      props?: Record<string, any>;
      revenue?: {
        currency: string;
        amount: number;
      };
      callback?: () => void;
    }) => void;
  }
}

export {};

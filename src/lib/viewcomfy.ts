// src/lib/viewcomfy.ts
import { trackFalAiUsage } from '@/lib/monitoring';

export interface ViewComfyConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface ViewComfyParams {
  [key: string]: any;
}

export interface ViewComfyResult {
  prompt_id: string;
  status: string;
  completed: boolean;
  execution_time_seconds: number;
  prompt: Record<string, any>;
  outputs: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

export interface FaceSwapParams {
  sourceImageUrl: string;  // The pet mom photo
  targetImageUrl: string;  // The MonaLisa portrait
  artworkId: string;
}

export class ViewComfyClient {
  private config: ViewComfyConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: ViewComfyConfig) {
    this.config = config;
  }

  /**
   * Get access token for ViewComfy API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('🔑 Getting ViewComfy access token...');
    
    const response = await fetch(`${this.config.apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get ViewComfy access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Set expiry to 50 minutes (tokens typically last 1 hour)
    this.tokenExpiry = Date.now() + (50 * 60 * 1000);
    
    console.log('✅ ViewComfy access token obtained');
    return this.accessToken!;
  }

  /**
   * Execute a ComfyUI workflow via ViewComfy API
   */
  async executeWorkflow(params: ViewComfyParams, overrideWorkflow?: any): Promise<ViewComfyResult> {
    const startTime = Date.now();
    const requestId = `viewcomfy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const token = await this.getAccessToken();
      
      console.log('🚀 Executing ViewComfy workflow...');
      
      // Prepare the request body
      const requestBody: any = {
        params: params
      };
      
      if (overrideWorkflow) {
        requestBody.override_workflow_api = overrideWorkflow;
      }

      const response = await fetch(`${this.config.apiUrl}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ViewComfy API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ ViewComfy workflow completed successfully');
      console.log(`⏱️ Execution time: ${result.execution_time_seconds}s`);
      
      // Track usage for monitoring
      await trackFalAiUsage({
        endpoint: 'viewcomfy-faceswap',
        requestId,
        status: 'success',
        responseTime: Date.now() - startTime,
        cost: 0.08 // Estimated cost for faceswap operation
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ ViewComfy workflow failed:', error);
      
      // Track failed usage
      await trackFalAiUsage({
        endpoint: 'viewcomfy-faceswap',
        requestId,
        status: 'error',
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Execute faceswap workflow specifically
   */
  async executeFaceSwap(params: FaceSwapParams): Promise<string> {
    console.log('👤 Starting faceswap operation...');
    console.log('📊 Faceswap params:', {
      artworkId: params.artworkId,
      hasSourceImage: !!params.sourceImageUrl,
      hasTargetImage: !!params.targetImageUrl
    });

    // Prepare parameters for the ComfyUI workflow
    // These parameter names should match your ComfyUI workflow_api.json
    const workflowParams = {
      // Source image (pet mom photo) - adjust node ID based on your workflow
      "source_image_input": params.sourceImageUrl,
      
      // Target image (MonaLisa portrait) - adjust node ID based on your workflow  
      "target_image_input": params.targetImageUrl,
      
      // You can add more parameters here based on your ComfyUI workflow
      // For example:
      // "face_restore_strength": 0.8,
      // "blend_ratio": 0.7,
      // "output_format": "jpeg"
    };

    const result = await this.executeWorkflow(workflowParams);
    
    if (!result.outputs || result.outputs.length === 0) {
      throw new Error('No output images generated from faceswap');
    }

    // Return the URL of the first output image
    const outputImageUrl = result.outputs[0].url;
    console.log('✅ Faceswap completed, output URL:', outputImageUrl);
    
    return outputImageUrl;
  }
}

/**
 * Create ViewComfy client instance
 */
export function createViewComfyClient(): ViewComfyClient {
  const config: ViewComfyConfig = {
    apiUrl: process.env.VIEWCOMFY_API_URL || '',
    clientId: process.env.VIEWCOMFY_CLIENT_ID || '',
    clientSecret: process.env.VIEWCOMFY_CLIENT_SECRET || ''
  };

  if (!config.apiUrl || !config.clientId || !config.clientSecret) {
    throw new Error('Missing ViewComfy configuration. Please set VIEWCOMFY_API_URL, VIEWCOMFY_CLIENT_ID, and VIEWCOMFY_CLIENT_SECRET environment variables.');
  }

  return new ViewComfyClient(config);
}

/**
 * Convenience function for faceswap operations
 */
export async function performFaceSwap(params: FaceSwapParams): Promise<string> {
  const client = createViewComfyClient();
  return await client.executeFaceSwap(params);
}

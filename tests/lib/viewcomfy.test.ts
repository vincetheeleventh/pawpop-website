// tests/lib/viewcomfy.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViewComfyClient, createViewComfyClient, performFaceSwap } from '@/lib/viewcomfy';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
  trackFalAiUsage: vi.fn(),
}));

describe('ViewComfy Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.VIEWCOMFY_API_URL = 'https://api.viewcomfy.com/v1';
    process.env.VIEWCOMFY_CLIENT_ID = 'test-client-id';
    process.env.VIEWCOMFY_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ViewComfyClient', () => {
    it('should create client with valid configuration', () => {
      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      expect(client).toBeInstanceOf(ViewComfyClient);
    });

    it('should get access token successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      const token = await client['getAccessToken']();

      expect(token).toBe('test-access-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.viewcomfy.com/v1/auth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            grant_type: 'client_credentials'
          })
        })
      );
    });

    it('should handle token request failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'invalid-client-id',
        clientSecret: 'invalid-client-secret'
      };

      const client = new ViewComfyClient(config);
      
      await expect(client['getAccessToken']()).rejects.toThrow(
        'Failed to get ViewComfy access token: Unauthorized'
      );
    });

    it('should reuse valid access token', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      
      // First call should fetch token
      const token1 = await client['getAccessToken']();
      expect(token1).toBe('test-access-token');
      
      // Second call should reuse token (no additional fetch)
      const token2 = await client['getAccessToken']();
      expect(token2).toBe('test-access-token');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should execute workflow successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token'
      };

      const mockWorkflowResponse = {
        prompt_id: 'test-prompt-123',
        status: 'completed',
        completed: true,
        execution_time_seconds: 45.2,
        prompt: {},
        outputs: [
          {
            filename: 'output.jpg',
            url: 'https://viewcomfy.com/output/test-output.jpg',
            type: 'image'
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorkflowResponse)
        });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      const params = {
        'source_image_input': 'https://example.com/source.jpg',
        'target_image_input': 'https://example.com/target.jpg'
      };

      const result = await client.executeWorkflow(params);

      expect(result).toEqual(mockWorkflowResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.viewcomfy.com/v1/run',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-access-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            params: params
          })
        })
      );
    });

    it('should handle workflow execution failure', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Workflow execution failed')
        });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      const params = {
        'source_image_input': 'https://example.com/source.jpg',
        'target_image_input': 'https://example.com/target.jpg'
      };

      await expect(client.executeWorkflow(params)).rejects.toThrow(
        'ViewComfy API error: 500 Internal Server Error - Workflow execution failed'
      );
    });

    it('should execute faceswap successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token'
      };

      const mockWorkflowResponse = {
        prompt_id: 'test-prompt-123',
        status: 'completed',
        completed: true,
        execution_time_seconds: 45.2,
        prompt: {},
        outputs: [
          {
            filename: 'faceswap_output.jpg',
            url: 'https://viewcomfy.com/output/faceswap-result.jpg',
            type: 'image'
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorkflowResponse)
        });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      const faceswapParams = {
        sourceImageUrl: 'https://example.com/pet-mom.jpg',
        targetImageUrl: 'https://example.com/monalisa.jpg',
        artworkId: 'test-artwork-123'
      };

      const result = await client.executeFaceSwap(faceswapParams);

      expect(result).toBe('https://viewcomfy.com/output/faceswap-result.jpg');
    });

    it('should handle faceswap with no outputs', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token'
      };

      const mockWorkflowResponse = {
        prompt_id: 'test-prompt-123',
        status: 'completed',
        completed: true,
        execution_time_seconds: 45.2,
        prompt: {},
        outputs: [] // No outputs
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorkflowResponse)
        });

      const config = {
        apiUrl: 'https://api.viewcomfy.com/v1',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const client = new ViewComfyClient(config);
      const faceswapParams = {
        sourceImageUrl: 'https://example.com/pet-mom.jpg',
        targetImageUrl: 'https://example.com/monalisa.jpg',
        artworkId: 'test-artwork-123'
      };

      await expect(client.executeFaceSwap(faceswapParams)).rejects.toThrow(
        'No output images generated from faceswap'
      );
    });
  });

  describe('createViewComfyClient', () => {
    it('should create client with environment variables', () => {
      const client = createViewComfyClient();
      expect(client).toBeInstanceOf(ViewComfyClient);
    });

    it('should throw error with missing environment variables', () => {
      delete process.env.VIEWCOMFY_API_URL;
      
      expect(() => createViewComfyClient()).toThrow(
        'Missing ViewComfy configuration. Please set VIEWCOMFY_API_URL, VIEWCOMFY_CLIENT_ID, and VIEWCOMFY_CLIENT_SECRET environment variables.'
      );
    });
  });

  describe('performFaceSwap', () => {
    it('should perform faceswap using convenience function', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token'
      };

      const mockWorkflowResponse = {
        prompt_id: 'test-prompt-123',
        status: 'completed',
        completed: true,
        execution_time_seconds: 45.2,
        prompt: {},
        outputs: [
          {
            filename: 'faceswap_output.jpg',
            url: 'https://viewcomfy.com/output/faceswap-result.jpg',
            type: 'image'
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorkflowResponse)
        });

      const faceswapParams = {
        sourceImageUrl: 'https://example.com/pet-mom.jpg',
        targetImageUrl: 'https://example.com/monalisa.jpg',
        artworkId: 'test-artwork-123'
      };

      const result = await performFaceSwap(faceswapParams);

      expect(result).toBe('https://viewcomfy.com/output/faceswap-result.jpg');
    });
  });
});

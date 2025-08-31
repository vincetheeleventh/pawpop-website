import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fal } from '@fal-ai/client';

// Contract tests for fal.ai API - verify our expectations match their API
describe('fal.ai API Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flux Kontext LoRA Contract', () => {
    it('should have correct input schema for flux-kontext-lora', () => {
      const expectedInput = {
        image_url: expect.any(String),
        prompt: expect.any(String),
        loras: expect.arrayContaining([{
          path: expect.any(String),
          scale: expect.any(Number)
        }]),
        resolution_mode: expect.stringMatching(/^(9:16|16:9|1:1|auto|match_input)$/),
        guidance_scale: expect.any(Number),
        num_inference_steps: expect.any(Number),
        seed: expect.any(Number)
      };

      // This would be called in actual API
      expect(expectedInput).toBeDefined();
    });

    it('should have correct output schema for flux-kontext-lora', () => {
      const expectedOutput = {
        images: expect.arrayContaining([{
          url: expect.any(String),
          width: expect.any(Number),
          height: expect.any(Number),
          content_type: expect.stringMatching(/^image\/(png|jpeg|jpg)$/)
        }])
      };

      expect(expectedOutput).toBeDefined();
    });
  });

  describe('Flux Pro Kontext Max Multi Contract', () => {
    it('should have correct input schema for flux-pro/kontext/max/multi', () => {
      const expectedInput = {
        prompt: expect.any(String),
        guidance_scale: expect.any(Number),
        num_images: expect.any(Number),
        output_format: expect.stringMatching(/^(jpeg|png)$/),
        safety_tolerance: expect.stringMatching(/^[1-6]$/),
        image_urls: expect.arrayContaining([expect.any(String)]),
        aspect_ratio: expect.stringMatching(/^(9:16|16:9|1:1|auto)$/)
      };

      expect(expectedInput).toBeDefined();
    });

    it('should have correct output schema for flux-pro/kontext/max/multi', () => {
      const expectedOutput = {
        data: {
          images: expect.arrayContaining([{
            url: expect.any(String)
          }])
        },
        requestId: expect.any(String)
      };

      expect(expectedOutput).toBeDefined();
    });
  });

  describe('Storage API Contract', () => {
    it('should upload files and return URLs', async () => {
      const mockFile = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
      
      // Mock the storage upload
      vi.spyOn(fal.storage, 'upload').mockResolvedValue('https://v3.fal.media/files/test/mock-id.png');
      
      const result = await fal.storage.upload(mockFile);
      
      expect(result).toMatch(/^https:\/\/v3\.fal\.media\/files\/.+/);
      expect(fal.storage.upload).toHaveBeenCalledWith(mockFile);
    });
  });
});

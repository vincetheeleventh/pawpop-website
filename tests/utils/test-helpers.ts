import { vi, expect } from 'vitest';

// Helper to create deterministic test environments
export function setupDeterministicTest() {
  // Fix random seeds for consistent results
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  vi.spyOn(Math, 'floor').mockImplementation((n) => Math.floor(n));
}

// Helper to validate image response
export function validateImageResponse(response: Response, expectedType: string) {
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe(expectedType);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

// Helper to validate error response
export function validateErrorResponse(response: Response, expectedStatus: number, expectedError: string) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('Content-Type')).toContain('application/json');
}

// Helper to create mock fal.ai responses
export function createMockFalResponse(imageUrl: string, requestId?: string) {
  return {
    data: {
      images: [{ url: imageUrl }]
    },
    requestId: requestId || 'mock-request-id'
  };
}

// Helper to create mock streaming response
export function createMockStreamResponse(imageUrl: string) {
  return {
    [Symbol.asyncIterator]: async function* () {
      yield { type: 'processing' };
      yield { type: 'complete' };
    },
    done: vi.fn().mockResolvedValue({
      images: [{ url: imageUrl }]
    })
  };
}

// Helper to validate API call parameters
export function validateMonaLisaMakerCall(mockCall: any) {
  expect(mockCall[0]).toBe('fal-ai/flux-kontext-lora');
  expect(mockCall[1].input).toMatchObject({
    prompt: 'keep likeness, change pose and style to mona lisa, keep hairstyle',
    loras: [{
      path: 'https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors',
      scale: 1.0
    }],
    resolution_mode: '9:16',
    guidance_scale: 7.5,
    num_inference_steps: 28
  });
}

export function validatePetIntegrationCall(mockCall: any) {
  expect(mockCall[0]).toBe('fal-ai/flux-pro/kontext/max/multi');
  expect(mockCall[1].input).toMatchObject({
    prompt: 'Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet',
    guidance_scale: 3.5,
    num_images: 1,
    output_format: 'jpeg',
    safety_tolerance: '2',
    aspect_ratio: '9:16'
  });
  expect(mockCall[1].input.image_urls).toHaveLength(2);
}

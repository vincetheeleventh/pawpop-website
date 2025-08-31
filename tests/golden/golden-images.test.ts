import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Golden image tests with tolerance for image processing
describe('Golden Image Tests', () => {
  const GOLDEN_DIR = path.join(__dirname, 'fixtures');
  const OUTPUT_DIR = path.join(__dirname, '../../public/images');

  function calculateImageHash(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    return createHash('md5').update(imageBuffer).digest('hex');
  }

  function compareImageSizes(image1Path: string, image2Path: string, tolerance = 0.1): boolean {
    const stats1 = fs.statSync(image1Path);
    const stats2 = fs.statSync(image2Path);
    
    const sizeDiff = Math.abs(stats1.size - stats2.size) / stats1.size;
    return sizeDiff <= tolerance;
  }

  it('should maintain consistent MonaLisa output quality', () => {
    const currentOutput = path.join(OUTPUT_DIR, 'flux-test-output.png');
    const goldenOutput = path.join(GOLDEN_DIR, 'golden-monalisa-output.png');
    
    if (!fs.existsSync(currentOutput)) {
      console.warn('No current output found, skipping golden test');
      return;
    }

    if (!fs.existsSync(goldenOutput)) {
      // Create golden file if it doesn't exist
      fs.copyFileSync(currentOutput, goldenOutput);
      console.log('Created golden image:', goldenOutput);
      return;
    }

    // Compare file sizes with 10% tolerance
    const sizesMatch = compareImageSizes(currentOutput, goldenOutput, 0.1);
    expect(sizesMatch).toBe(true);
  });

  it('should maintain consistent pet integration output quality', () => {
    const currentOutput = path.join(OUTPUT_DIR, 'pet-integration-output.jpg');
    const goldenOutput = path.join(GOLDEN_DIR, 'golden-pet-integration.jpg');
    
    if (!fs.existsSync(currentOutput)) {
      console.warn('No current pet integration output found, skipping golden test');
      return;
    }

    if (!fs.existsSync(goldenOutput)) {
      // Create golden file if it doesn't exist
      fs.copyFileSync(currentOutput, goldenOutput);
      console.log('Created golden pet integration image:', goldenOutput);
      return;
    }

    // Compare file sizes with 15% tolerance (pet integration may vary more)
    const sizesMatch = compareImageSizes(currentOutput, goldenOutput, 0.15);
    expect(sizesMatch).toBe(true);
  });

  it('should detect significant quality degradation', () => {
    const testOutput = path.join(OUTPUT_DIR, 'flux-test-output.png');
    
    if (!fs.existsSync(testOutput)) {
      console.warn('No test output found, skipping quality test');
      return;
    }

    const stats = fs.statSync(testOutput);
    
    // Image should be at least 100KB (quality threshold)
    expect(stats.size).toBeGreaterThan(100 * 1024);
    
    // Image should not be larger than 5MB (reasonable upper bound)
    expect(stats.size).toBeLessThan(5 * 1024 * 1024);
  });
});

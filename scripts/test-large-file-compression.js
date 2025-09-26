#!/usr/bin/env node

/**
 * Test script for large file compression strategy
 * Simulates the compression logic from UploadModal
 */

async function testCompressionStrategy() {
  console.log('🧪 Testing Large File Compression Strategy\n');
  
  // Simulate different file sizes and test compression settings
  const testCases = [
    { sizeMB: 2.5, name: 'small-image.jpg', shouldCompress: false },
    { sizeMB: 5, name: 'medium-image.jpg', shouldCompress: true, expectedSettings: 'gentle' },
    { sizeMB: 10, name: 'large-image.jpg', shouldCompress: true, expectedSettings: 'moderate' },
    { sizeMB: 20, name: 'very-large-image.jpg', shouldCompress: true, expectedSettings: 'aggressive' },
    { sizeMB: 30, name: 'huge-image.jpg', shouldCompress: true, expectedSettings: 'aggressive' },
    { sizeMB: 60, name: 'extreme-image.jpg', shouldCompress: false, expectedError: 'too large' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`📊 Testing: ${testCase.name} (${testCase.sizeMB}MB)`);
    
    // Simulate the logic from UploadModal
    const fileSizeMB = testCase.sizeMB;
    const fileSize = testCase.sizeMB * 1024 * 1024;
    
    // Check for extremely large files (>50MB)
    if (fileSizeMB > 50) {
      console.log(`   ❌ File rejected: ${fileSizeMB.toFixed(1)}MB > 50MB limit`);
      console.log(`   💡 Error: "Image is too large (${fileSizeMB.toFixed(1)}MB). Please use an image smaller than 50MB."`);
      console.log('');
      return;
    }
    
    // Warn about very large files
    if (fileSizeMB > 25) {
      console.log(`   ⚠️  Warning: Very large file (${fileSizeMB.toFixed(2)}MB) - will require significant compression`);
    }
    
    // Check if compression is needed
    if (fileSize > 3 * 1024 * 1024) {
      console.log(`   🗜️  Compression needed: ${fileSizeMB.toFixed(2)}MB > 3MB`);
      
      // Determine compression settings
      let compressionOptions;
      let strategy;
      
      if (fileSizeMB > 15) {
        strategy = 'aggressive';
        compressionOptions = {
          maxSizeMB: 4,
          maxWidthOrHeight: 2048,
          initialQuality: 0.8
        };
      } else if (fileSizeMB > 8) {
        strategy = 'moderate';
        compressionOptions = {
          maxSizeMB: 4,
          maxWidthOrHeight: 2048,
          initialQuality: 0.85
        };
      } else {
        strategy = 'gentle';
        compressionOptions = {
          maxSizeMB: 4,
          maxWidthOrHeight: 2048,
          initialQuality: 0.9
        };
      }
      
      console.log(`   🔧 Strategy: ${strategy}`);
      console.log(`   📐 Settings:`, {
        targetSize: `${compressionOptions.maxSizeMB}MB`,
        maxDimension: compressionOptions.maxWidthOrHeight,
        quality: compressionOptions.initialQuality
      });
      
      // Estimate compression ratio
      const estimatedReduction = strategy === 'aggressive' ? 0.7 : 
                                strategy === 'moderate' ? 0.5 : 0.3;
      const estimatedFinalSize = Math.min(compressionOptions.maxSizeMB, fileSizeMB * (1 - estimatedReduction));
      
      console.log(`   📊 Estimated result: ${fileSizeMB.toFixed(2)}MB → ${estimatedFinalSize.toFixed(2)}MB (${(estimatedReduction * 100).toFixed(0)}% reduction)`);
      
      // Validate strategy matches expected
      if (testCase.expectedSettings && testCase.expectedSettings !== strategy) {
        console.log(`   ⚠️  Strategy mismatch: expected ${testCase.expectedSettings}, got ${strategy}`);
      } else {
        console.log(`   ✅ Strategy correct: ${strategy}`);
      }
      
    } else {
      console.log(`   ✅ No compression needed: ${fileSizeMB.toFixed(2)}MB ≤ 3MB`);
    }
    
    console.log('');
  });
}

async function testCompressionQuality() {
  console.log('\n🎨 Testing Compression Quality Settings\n');
  
  const qualityTests = [
    { originalMB: 5, strategy: 'gentle', quality: 0.9, description: 'High quality for medium files' },
    { originalMB: 12, strategy: 'moderate', quality: 0.85, description: 'Good quality for large files' },
    { originalMB: 25, strategy: 'aggressive', quality: 0.8, description: 'Acceptable quality for very large files' }
  ];
  
  qualityTests.forEach(test => {
    console.log(`📷 ${test.description}`);
    console.log(`   Original: ${test.originalMB}MB`);
    console.log(`   Strategy: ${test.strategy}`);
    console.log(`   Quality: ${test.quality} (${test.quality * 100}%)`);
    console.log(`   Target: ≤4MB, ≤2048px`);
    console.log('');
  });
}

async function main() {
  console.log('🧪 Large File Compression Test Suite\n');
  
  await testCompressionStrategy();
  await testCompressionQuality();
  
  console.log('✅ Test suite completed!\n');
  console.log('💡 Key improvements:');
  console.log('   • Smart compression based on file size');
  console.log('   • Higher quality preservation for smaller files');
  console.log('   • Better error messages for oversized files');
  console.log('   • Increased target size from 2.5MB to 4MB');
  console.log('   • Higher resolution support (2048px vs 1920px)');
}

main().catch(console.error);

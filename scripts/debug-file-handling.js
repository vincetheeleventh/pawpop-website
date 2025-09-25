#!/usr/bin/env node

/**
 * Debug script to test file handling differences between local and production
 */

console.log('🔍 Debugging File Handling Differences');
console.log('='.repeat(50));

console.log('\n📋 Environment Information:');
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n📋 File API Support:');
console.log('File constructor available:', typeof File !== 'undefined');
console.log('FormData constructor available:', typeof FormData !== 'undefined');
console.log('Blob constructor available:', typeof Blob !== 'undefined');

// Test File creation
console.log('\n📋 File Creation Test:');
try {
  if (typeof File !== 'undefined') {
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    console.log('✅ File creation successful');
    console.log('  - Name:', testFile.name);
    console.log('  - Size:', testFile.size);
    console.log('  - Type:', testFile.type);
    console.log('  - instanceof File:', testFile instanceof File);
    console.log('  - Constructor name:', testFile.constructor.name);
  } else {
    console.log('❌ File constructor not available (Server-side)');
  }
} catch (error) {
  console.log('❌ File creation failed:', error.message);
}

// Test FormData
console.log('\n📋 FormData Test:');
try {
  if (typeof FormData !== 'undefined') {
    const formData = new FormData();
    console.log('✅ FormData creation successful');
    
    if (typeof File !== 'undefined') {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      formData.append('file', testFile);
      const retrievedFile = formData.get('file');
      console.log('  - File append/retrieve successful');
      console.log('  - Retrieved type:', typeof retrievedFile);
      console.log('  - Retrieved instanceof File:', retrievedFile instanceof File);
      console.log('  - Retrieved constructor:', retrievedFile?.constructor?.name);
    }
  } else {
    console.log('❌ FormData constructor not available');
  }
} catch (error) {
  console.log('❌ FormData test failed:', error.message);
}

console.log('\n📋 Potential Issues:');
console.log('1. Server-side rendering: File objects may not exist during SSR');
console.log('2. Serialization: File objects may be serialized/deserialized incorrectly');
console.log('3. State management: React state may not preserve File instances correctly');
console.log('4. Build optimization: Webpack may transform File handling differently');

console.log('\n📋 Recommendations:');
console.log('1. Add client-side checks: if (typeof window !== "undefined")');
console.log('2. Use proper file validation with null checks');
console.log('3. Consider using FileReader for consistent file handling');
console.log('4. Add more defensive programming around File instances');

console.log('\n🎯 Next Steps:');
console.log('1. Check production logs for the new debugging output');
console.log('2. Look for differences in file object properties');
console.log('3. Consider adding client-side only file validation');

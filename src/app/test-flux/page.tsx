import FluxTester from '@/components/common/FluxTester';

export default function TestFluxPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Flux LoRA Pipeline Testing
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the complete image processing pipeline: headshot overlay + Flux LoRA transformation.
            Upload a headshot, apply it to the Mona Lisa, and optionally transform it with AI.
          </p>
        </div>
        
        <FluxTester />
        
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h2>
            <div className="text-blue-800 space-y-2">
              <p><strong>1. Install dependencies:</strong></p>
              <code className="block bg-blue-100 p-2 rounded text-sm">npm install @fal-ai/client</code>
              
              <p className="pt-2"><strong>2. Set up API credentials:</strong></p>
              <p>Add to your <code>.env.local</code> file:</p>
              <code className="block bg-blue-100 p-2 rounded text-sm">
                FAL_KEY=your-fal-api-key<br/>
                # OR<br/>
                HF_TOKEN=your-huggingface-token
              </code>
              
              <p className="pt-2"><strong>3. Get API keys:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>fal.ai: <a href="https://fal.ai" className="underline">https://fal.ai</a></li>
                <li>Hugging Face: <a href="https://huggingface.co/settings/tokens" className="underline">https://huggingface.co/settings/tokens</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface FluxTesterProps {
  className?: string;
}

export default function FluxTester({ className = '' }: FluxTesterProps) {
  const [selectedHead, setSelectedHead] = useState('');
  const [fluxPrompt, setFluxPrompt] = useState('Transform this into a beautiful oil painting in the style of Van Gogh');
  const [fluxStrength, setFluxStrength] = useState(0.8);
  const [skipFlux, setSkipFlux] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const headshots = [
    'Screenshot_1.jpg',
    'Screenshot_2.jpg', 
    'Screenshot_3.jpg',
    'Screenshot_4.jpg',
    'Screenshot_5.jpg'
  ];

  const promptPresets = [
    'Transform this into a beautiful oil painting in the style of Van Gogh',
    'Make this look like a Renaissance masterpiece with dramatic lighting',
    'Convert this to a watercolor painting with soft, flowing colors',
    'Turn this into a modern digital art piece with vibrant neon colors',
    'Transform this into a classical portrait with baroque styling',
    'Make this look like an impressionist painting with visible brushstrokes'
  ];

  const handleGenerate = async () => {
    if (!selectedHead) {
      setError('Please select a headshot');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultImage(null);
    setProcessingStep('Starting...');

    try {
      const requestBody = {
        monaUrl: '/images/monalisa.png',
        headUrl: `/images/test headshots/${selectedHead}`,
        fit: 'width',
        scale: 1.0,
        fluxPrompt: skipFlux ? undefined : fluxPrompt,
        fluxStrength: fluxStrength,
        fluxGuidanceScale: 7.5,
        fluxSteps: 28,
        skipFlux: skipFlux
      };

      console.log('🚀 Sending request:', requestBody);
      setProcessingStep(skipFlux ? 'Creating overlay...' : 'Creating overlay and applying Flux transformation...');

      const response = await fetch('/api/overlay-flux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setProcessingStep('Processing complete! Loading result...');
      
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResultImage(imageUrl);
      setProcessingStep('');

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An error occurred');
      setProcessingStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center">Flux LoRA Pipeline Tester</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Select Headshot:</label>
            <div className="grid grid-cols-2 gap-2">
              {headshots.map((headshot) => (
                <button
                  key={headshot}
                  onClick={() => setSelectedHead(headshot)}
                  className={`p-2 text-sm rounded border ${
                    selectedHead === headshot
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                  }`}
                >
                  {headshot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={skipFlux}
                onChange={(e) => setSkipFlux(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Skip Flux transformation (overlay only)</span>
            </label>
          </div>

          {!skipFlux && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Flux Prompt:</label>
                <textarea
                  value={fluxPrompt}
                  onChange={(e) => setFluxPrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Describe how you want to transform the image..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quick Prompts:</label>
                <div className="space-y-1">
                  {promptPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setFluxPrompt(preset)}
                      className="block w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Transformation Strength: {fluxStrength}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={fluxStrength}
                  onChange={(e) => setFluxStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle (0.1)</span>
                  <span>Strong (1.0)</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={isProcessing || !selectedHead}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {isProcessing ? 'Processing...' : (skipFlux ? 'Generate Overlay' : 'Generate with Flux')}
          </button>

          {processingStep && (
            <div className="text-center text-sm text-blue-600 font-medium">
              {processingStep}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm font-medium">Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Result:</h3>
          
          {resultImage ? (
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <img
                src={resultImage}
                alt="Generated result"
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center text-gray-500">
              {isProcessing ? (
                <div className="space-y-2">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p>Processing...</p>
                </div>
              ) : (
                <p>Select a headshot and click generate to see the result</p>
              )}
            </div>
          )}

          {resultImage && (
            <div className="text-center">
              <a
                href={resultImage}
                download="flux-result.png"
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Download Result
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

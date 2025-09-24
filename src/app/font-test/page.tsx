export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-site-bg p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="font-arvo text-4xl font-bold text-text-primary">
          Arvo Font Test - This should be Arvo
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="font-arvo text-2xl font-bold text-text-primary mb-4">
            Arvo Font Examples
          </h2>
          
          <div className="space-y-4">
            <p className="font-arvo text-lg text-text-primary">
              This is Arvo regular weight (400) - The quick brown fox jumps over the lazy dog
            </p>
            
            <p className="font-arvo text-lg font-bold text-text-primary">
              This is Arvo bold weight (700) - The quick brown fox jumps over the lazy dog
            </p>
            
            <p className="font-geist text-lg text-text-primary">
              This is Geist for comparison - The quick brown fox jumps over the lazy dog
            </p>
            
            <p className="font-fredoka text-lg text-text-primary">
              This is Fredoka One for comparison - The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="font-arvo text-xl font-bold text-text-primary mb-4">
            Arvo in Different Sizes
          </h3>
          
          <div className="space-y-2">
            <p className="font-arvo text-sm text-text-primary">Small Arvo text (14px)</p>
            <p className="font-arvo text-base text-text-primary">Base Arvo text (16px)</p>
            <p className="font-arvo text-lg text-text-primary">Large Arvo text (18px)</p>
            <p className="font-arvo text-xl text-text-primary">XL Arvo text (20px)</p>
            <p className="font-arvo text-2xl text-text-primary">2XL Arvo text (24px)</p>
            <p className="font-arvo text-3xl text-text-primary">3XL Arvo text (30px)</p>
          </div>
        </div>
        
        <div className="text-center">
          <a 
            href="/"
            className="inline-block bg-cyclamen hover:bg-cyclamen/90 text-white font-arvo font-bold text-lg py-3 px-6 rounded-xl transition-all duration-200"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

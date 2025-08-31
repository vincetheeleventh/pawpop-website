// src/components/landing/ProcessSection.tsx

export const ProcessSection = () => {
  const steps = [
    {
      title: '1. Upload Your Photos',
      description: 'Share a photo of the lucky recipient and their beloved pet. Our artists work best with clear, well-lit images.',
      icon: '📸'
    },
    {
      title: '2. Our Artists Get to Work',
      description: 'Our digital artists personally review and perfect each portrait, ensuring the likeness and personality of both human and pet shine through.',
      icon: '🎨'
    },
    {
      title: '3. Approve Your Artwork',
      description: 'You\'ll receive a preview of your custom pop art to approve. We want to make sure you absolutely love it before we print.',
      icon: '✅'
    },
    {
      title: '4. Delivered to Your Door',
      description: 'Your one-of-a-kind artwork is professionally printed and shipped, ready to bring joy for years to come.',
      icon: '🚚'
    }
  ];

  return (
    <section id="process" className="section-padding bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Handcrafted Process</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From upload to delivery, we ensure every step creates the perfect portrait
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 font-bold text-3xl mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality Guarantee</h3>
            <p className="text-gray-600 mb-6">
              We're so confident you'll love your custom portrait that we offer unlimited revisions 
              and a 100% satisfaction guarantee.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited Revisions
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Money-Back Guarantee
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Expert Artists
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

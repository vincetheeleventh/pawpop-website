'use client';

const steps = [
  {
    number: '1',
    title: 'Upload Your Pet Photo',
    description: 'No cropping, no editing needed. Just upload your favorite pet photo and choose your free proof style.',
    icon: '📸',
  },
  {
    number: '2',
    title: 'Get Your Free Proof',
    description: 'Receive a watermarked preview in minutes. See the magic before you buy!',
    icon: '✨',
  },
  {
    number: '3',
    title: 'Love It? Get All 4 for $5',
    description: 'Purchase the complete pack with all 4 high-res parody styles. Instant digital delivery.',
    icon: '🎨',
  },
  {
    number: '4',
    title: 'Print, Share, Enjoy',
    description: 'Use your high-res files anywhere - prints, mugs, shirts, or share on social media.',
    icon: '🎁',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-site-bg">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-arvo text-4xl md:text-5xl font-bold text-text-primary mb-4">
            How It Works
          </h2>
          <p className="font-geist text-lg text-text-primary/70 max-w-2xl mx-auto">
            From upload to masterpiece in 4 simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line (hidden on mobile, shown on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-cyclamen to-pale-azure opacity-30" />
              )}

              {/* Step Card */}
              <div className="relative bg-card-surface rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-naples-yellow/20">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-cyclamen to-atomic-tangerine rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-fredoka text-xl font-bold text-white">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="text-6xl mb-4 text-center">{step.icon}</div>

                {/* Title */}
                <h3 className="font-arvo text-xl font-bold text-text-primary text-center mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-geist text-sm text-text-primary/70 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-card-surface rounded-2xl p-8 shadow-lg max-w-2xl">
            <h3 className="font-arvo text-2xl font-bold text-text-primary mb-4">
              Ready to see your pet in iconic parodies?
            </h3>
            <p className="font-geist text-text-primary/70 mb-6">
              Start with a <strong className="text-cyclamen">free watermarked proof</strong> - no credit card required
            </p>
            <button className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

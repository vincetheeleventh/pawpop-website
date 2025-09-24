export default function TestAnchorsPage() {
  const anchorLinks = [
    { href: '/#home', label: 'Home Section' },
    { href: '/#gallery', label: 'Gallery Section' },
    { href: '/#testimonials', label: 'Testimonials Section' },
    { href: '/#why', label: 'Why PawPop Section' },
    { href: '/#process', label: 'Process Section' },
  ];

  return (
    <div className="min-h-screen bg-site-bg p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-arvo font-bold text-text-primary mb-8 text-center">
          Anchor Navigation Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-arvo font-bold text-text-primary mb-4">
            Test All Anchor Links:
          </h2>
          
          <div className="space-y-3">
            {anchorLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="
                  block w-full text-left
                  bg-atomic-tangerine/10 hover:bg-atomic-tangerine/20
                  text-text-primary font-medium
                  px-4 py-3 rounded-lg
                  transition-all duration-200
                  hover:scale-105 hover:shadow-md
                "
              >
                {link.label} → {link.href}
              </a>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-pale-azure/10 rounded-lg">
            <h3 className="font-bold text-text-primary mb-2">Expected Behavior:</h3>
            <ul className="text-sm text-text-primary/80 space-y-1">
              <li>• Smooth scrolling to each section</li>
              <li>• Proper offset for fixed header (80px)</li>
              <li>• Navigation links in header should work</li>
              <li>• All sections should be properly anchored</li>
            </ul>
          </div>
          
          <div className="mt-4 text-center">
            <a
              href="/"
              className="
                inline-block
                bg-cyclamen hover:bg-pink-600
                text-white font-fredoka font-medium
                px-6 py-2 rounded-full
                transition-all duration-200
                hover:scale-105 hover:shadow-lg
              "
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';

const parodyStyles = [
  {
    id: 'wizard',
    name: 'Wizard',
    description: 'Your pet as a magical wizard in an enchanted portrait',
    icon: '🪄',
    color: 'from-purple-500 to-indigo-600',
    image: '/images/parodypack/parodypack1.png',
  },
  {
    id: 'paws',
    name: 'PAWS',
    description: 'Iconic movie poster with your pet as the star',
    icon: '🦈',
    color: 'from-blue-500 to-cyan-600',
    image: '/images/parodypack/parodypack2.jpeg',
  },
  {
    id: 'popstar',
    name: 'Popstar',
    description: 'Your pet in the iconic 80s album cover pose',
    icon: '🎤',
    color: 'from-red-500 to-pink-600',
    image: '/images/parodypack/parodypack3.jpeg',
  },
  {
    id: 'dogfather',
    name: 'Dogfather',
    description: 'Your pet as a mafia boss in dramatic lighting',
    icon: '🎩',
    color: 'from-amber-600 to-orange-700',
    image: '/images/parodypack/parodypack4.jpeg',
  },
];

export default function ParodyStylesSection() {
  return (
    <section className="py-20 px-4 bg-card-surface">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-arvo text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Choose Your Free Proof Style
          </h2>
          <p className="font-geist text-lg text-text-primary/70 max-w-2xl mx-auto">
            Pick your favorite parody to get started. You'll get all 4 styles when you purchase the $5 pack!
          </p>
        </div>

        {/* Parody Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {parodyStyles.map((style) => (
            <div
              key={style.id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-cyclamen cursor-pointer"
            >
              {/* Image */}
              <div className="relative w-full aspect-square overflow-hidden">
                <Image
                  src={style.image}
                  alt={`${style.name} parody style example`}
                  fill
                  className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Icon Badge */}
                <div className={`absolute top-3 right-3 w-12 h-12 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {style.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Title */}
                <h3 className="font-arvo text-xl font-bold text-text-primary text-center mb-2">
                  {style.name}
                </h3>

                {/* Description */}
                <p className="font-geist text-sm text-text-primary/60 text-center">
                  {style.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyclamen/5 to-atomic-tangerine/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="font-geist text-lg text-text-primary/80 mb-4">
            <strong className="text-cyclamen">All 4 styles included</strong> in the $5 Parody Pack
          </p>
          <div className="inline-flex items-center gap-2 bg-naples-yellow/20 px-6 py-3 rounded-full">
            <svg className="w-5 h-5 text-atomic-tangerine" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-geist font-semibold text-text-primary">High-resolution digital files ready for printing or sharing</span>
          </div>
        </div>
      </div>
    </section>
  );
}

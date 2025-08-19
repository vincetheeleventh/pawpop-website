// src/components/landing/TestimonialsSection.tsx

import { landingPageCopy } from '@/lib/copy';

export const TestimonialsSection = () => {
  const { title, reviews } = landingPageCopy.testimonials;

  return (
    <section id="reviews" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-lg shadow-sm">
              <p className="text-gray-600 italic mb-4">{review.quote}</p>
              <p className="text-gray-800 font-bold">- {review.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

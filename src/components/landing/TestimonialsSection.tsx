// src/components/landing/TestimonialsSection.tsx

import { landingPageCopy } from '@/lib/copy';

export const TestimonialsSection = () => {
  const { title, reviews } = landingPageCopy.testimonials;

  return (
    <section id="reviews" className="py-20 bg-base-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {reviews.map((review, index) => (
            <div key={index} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <p className="text-base-content/80 italic mb-4">"{review.quote}"</p>
                <p className="font-bold">- {review.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import { useEffect, useState } from 'react';

import reviews from './reviews.json';

/** True when the user asked the OS for less motion. */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Testimonial carousel on the auth pages (Figma A1/A2: quote in a translucent
 * bordered card, stars, author initial). Text uses `on-accent`, so the panel
 * reads in both themes (white on blue, navy on pastel blue).
 */
const ConvincingBanner = () => {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    // Auto-advance is motion too: hold still for reduced-motion users.
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % reviews.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slide]);

  const handleClick = (index: number) => {
    setSlide(index);
  };

  const currentReview = reviews[slide];

  return (
    <div className="bg-accent flex justify-center items-center py-12 px-4 overflow-hidden relative">
      <div className="max-w-3xl text-center flex flex-col items-center gap-4">
        <h2 className="text-h2 text-on-accent font-bold mb-2">
          Our users love us
        </h2>
        <p className="text-body-l text-on-accent">
          {currentReview.name} recently published this {currentReview.review}{' '}
          stars review
        </p>
        <figure className="bg-accent-hover/50 border-on-accent/30 flex w-full max-w-[420px] flex-col gap-3 rounded-card border p-4">
          <p
            className="text-body-xl-strong text-on-accent tracking-widest"
            role="img"
            aria-label={`${currentReview.review} out of 5 stars`}
          >
            {'★'.repeat(currentReview.review)}
          </p>
          <blockquote className="text-body-m italic text-on-accent min-h-[66px]">
            "{currentReview.text}"
          </blockquote>
          <hr className="border-on-accent/20" />
          <figcaption className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-on-accent/20 text-on-accent text-button-m font-bold flex size-9 shrink-0 items-center justify-center rounded-full"
            >
              {currentReview.name.charAt(0)}
            </span>
            <span className="text-body-m text-on-accent font-bold">
              {currentReview.name}
            </span>
          </figcaption>
        </figure>
        <div className="flex gap-4 justify-center mt-2">
          {reviews.map((_, index) => (
            // 48x24 hit area around a 6px bar (WCAG 2.5.8), with a focus ring
            // in the label colour so it shows on the accent panel.
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              className="group flex h-6 w-12 cursor-pointer items-center rounded-button focus:outline-none focus-visible:ring-2 focus-visible:ring-on-accent focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === slide ? 'true' : undefined}
            >
              <span
                className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                  index === slide
                    ? 'bg-on-accent'
                    : 'bg-on-accent/50 group-hover:bg-on-accent/70'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        className="motion-safe:animate-spin h-96 w-96 rounded-xl bg-on-accent/5 absolute -top-5 right-5 pointer-events-none will-change-transform"
        style={{ animationDuration: '30s' }}
      />
      <div
        className="motion-safe:animate-spin h-96 w-96 rounded-xl bg-on-accent/5 absolute -bottom-5 -left-5 pointer-events-none will-change-transform"
        style={{ animationDuration: '30s' }}
      />
    </div>
  );
};

export default ConvincingBanner;

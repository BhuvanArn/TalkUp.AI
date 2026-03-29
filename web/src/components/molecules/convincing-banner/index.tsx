import { useEffect, useState } from 'react';

import reviews from './reviews.json';

const ConvincingBanner = () => {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
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
    <div className="bg-accent/90 flex justify-center items-center py-12 px-4 overflow-hidden relative">
      <div className="max-w-3xl text-center flex flex-col gap-4">
        <h2 className="text-h2 text-white font-bold mb-2">Our users love us</h2>
        <p className="text-body-l text-white/90">
          {currentReview.name} recently published this {currentReview.review}{' '}
          stars review
        </p>
        <blockquote className="text-body-l italic text-white min-h-[100px] flex items-center justify-center">
          "{currentReview.text}"
        </blockquote>
        <p className="text-white text-body-l-strong mt-2">
          - {currentReview.name}
        </p>
        <div className="flex gap-3 justify-center mt-4">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer w-12 ${
                index === slide
                  ? 'bg-white opacity-100'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div
        className="animate-spin h-96 w-96 rounded-xl bg-white/3 absolute -top-5 right-5 pointer-events-none will-change-transform"
        style={{ animationDuration: '30s' }}
      />
      <div
        className="animate-spin h-96 w-96 rounded-xl bg-white/3 absolute -bottom-5 -left-5 pointer-events-none will-change-transform"
        style={{ animationDuration: '30s' }}
      />
    </div>
  );
};

export default ConvincingBanner;

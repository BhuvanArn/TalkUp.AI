import { useLocale } from '@/hooks/i18n/useLocale';
import type { ParseKeys } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Testimonials: the review text is translated, the name and rating are not. */
const REVIEWS = [
  { name: 'Florent', rating: 5, textKey: 'convincingBanner.reviews.florent' },
  { name: 'Tom', rating: 5, textKey: 'convincingBanner.reviews.tom' },
  { name: 'Agathe', rating: 4.5, textKey: 'convincingBanner.reviews.agathe' },
] as const satisfies readonly {
  name: string;
  rating: number;
  textKey: ParseKeys<'auth'>;
}[];

const ConvincingBanner = () => {
  const { t } = useTranslation('auth');
  const { intlLocale } = useLocale();
  const ratingFormat = useMemo(
    () => new Intl.NumberFormat(intlLocale),
    [intlLocale],
  );
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % REVIEWS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slide]);

  const handleClick = (index: number) => {
    setSlide(index);
  };

  const currentReview = REVIEWS[slide];

  return (
    <div className="bg-accent/90 flex justify-center items-center py-12 px-4 overflow-hidden relative">
      <div className="max-w-3xl text-center flex flex-col gap-4">
        <h2 className="text-h2 text-white font-bold mb-2">
          {t('convincingBanner.title')}
        </h2>
        <p className="text-body-l text-white/90">
          {t('convincingBanner.recentReview', {
            name: currentReview.name,
            rating: ratingFormat.format(currentReview.rating),
          })}
        </p>
        <blockquote className="text-body-l italic text-white min-h-[100px] flex items-center justify-center">
          {t('convincingBanner.quote', { text: t(currentReview.textKey) })}
        </blockquote>
        <p className="text-white text-body-l-strong mt-2">
          {t('convincingBanner.attribution', { name: currentReview.name })}
        </p>
        <div className="flex gap-3 justify-center mt-4">
          {REVIEWS.map((review, index) => (
            <button
              key={review.name}
              onClick={() => handleClick(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer w-12 ${
                index === slide
                  ? 'bg-white opacity-100'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={t('convincingBanner.goToSlide', {
                number: index + 1,
              })}
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

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PricingTiles } from './PricingPage';

export const LandingPage = () => {
  const { t } = useTranslation();
  const features = t('features.items', { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col gap-8 sm:gap-12 lg:gap-16 text-white">
      {/* Hero Section */}
      <section className="glass-card px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center shadow-2xl animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-accent to-secondary bg-clip-text text-transparent px-2">
          {t('hero.title')}
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed px-4">
          {t('hero.subtitle')}
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
          <Link
            to="/register"
            className="group rounded-full bg-gradient-to-r from-accent to-sky-400 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-slate-900 hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto touch-manipulation active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              {t('hero.ctaPrimary')}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link
            to="/pricing"
            className="rounded-full border-2 border-white/30 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white/90 hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto touch-manipulation active:scale-95"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="glass-card p-6 sm:p-8 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">{t('features.title')}</h2>
          </div>
          <ul className="space-y-4 text-white/80">
            {features.map((item, index) => (
              <li key={item} className="flex items-start gap-3 group" style={{ animationDelay: `${index * 100}ms` }}>
                <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-accent group-hover:scale-150 transition-transform" />
                <span className="group-hover:text-white transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card flex flex-col justify-between p-8 hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-300 hover:scale-[1.02]">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold">{t('subscription.title')}</h2>
            </div>
            <ul className="space-y-4 text-white/80">
              {(t('subscription.benefits', { returnObjects: true }) as string[]).map((benefit, index) => (
                <li key={benefit} className="flex items-start gap-3 group" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-secondary group-hover:scale-150 transition-transform" />
                  <span className="group-hover:text-white transition-colors">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/dashboard"
            className="mt-8 rounded-full bg-gradient-to-r from-secondary to-purple-600 px-6 py-3 text-center text-base font-semibold text-white hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 hover:scale-105"
          >
            {t('subscription.cta')}
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="glass-card p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
          {t('pricing.title')}
        </h2>
        <PricingTiles compact />
      </section>
    </div>
  );
};

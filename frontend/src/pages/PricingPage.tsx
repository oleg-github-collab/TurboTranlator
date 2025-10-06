import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTranslationModels } from '../hooks/useTranslationModels';

interface PricingTilesProps {
  compact?: boolean;
}

export const PricingTiles = ({ compact }: PricingTilesProps = {}) => {
  const { data: models } = useTranslationModels();
  const { t } = useTranslation();

  if (!models) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {models.map((model, index) => (
        <article
          key={model.key}
          className="group flex h-full flex-col justify-between rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-6 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.03]"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white group-hover:text-accent transition-colors">
                {model.displayName}
              </h3>
              {index === 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
                  Popular
                </span>
              )}
            </div>
            <div className="mb-4">
              <p className="text-4xl font-bold text-accent group-hover:scale-110 transition-transform inline-block">
                {model.pricePer1860.toFixed(2)} €
              </p>
              <p className="text-sm text-white/70 mt-1">{t('pricing.perCharacters')}</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {model.features.slice(0, compact ? 3 : 5).map((feature) => (
                <li key={feature} className="flex gap-3 group/item">
                  <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0 group-hover/item:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="group-hover/item:text-white transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Speed: {model.speedScore}/10</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Accuracy: {model.accuracyScore}/10</span>
              </div>
            </div>
            <p className="text-xs text-white/50">Provider: {model.provider}</p>
          </div>
        </article>
      ))}
    </div>
  );
};

export const PricingPage = () => {
  const { t } = useTranslation();
  return (
    <div className="text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
          {t('pricing.title')}
        </h1>
        <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">{t('hero.subtitle')}</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/register"
            className="rounded-full bg-gradient-to-r from-accent to-sky-400 px-6 py-3 text-sm font-semibold text-slate-900 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105"
          >
            {t('hero.ctaPrimary')}
          </Link>
        </div>
      </div>
      <PricingTiles />
    </div>
  );
};

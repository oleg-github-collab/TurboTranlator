import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950/80 backdrop-blur-lg text-white/80 border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold text-white">Kaminskyi Language Intelligence</p>
          <p className="text-sm text-white/60">{t('footer.rights', { year })}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link
            to="/legal/impressum"
            className="hover:text-accent transition-colors duration-200 hover:underline decoration-accent underline-offset-4"
          >
            {t('footer.imprint')}
          </Link>
          <Link
            to="/legal/datenschutz"
            className="hover:text-accent transition-colors duration-200 hover:underline decoration-accent underline-offset-4"
          >
            {t('footer.privacy')}
          </Link>
          <Link
            to="/legal/agb"
            className="hover:text-accent transition-colors duration-200 hover:underline decoration-accent underline-offset-4"
          >
            {t('footer.terms')}
          </Link>
          <Link
            to="/legal/cookies"
            className="hover:text-accent transition-colors duration-200 hover:underline decoration-accent underline-offset-4"
          >
            {t('footer.cookies')}
          </Link>
          <Link
            to="/legal/widerruf"
            className="hover:text-accent transition-colors duration-200 hover:underline decoration-accent underline-offset-4"
          >
            {t('footer.withdrawal')}
          </Link>
        </nav>
      </div>
    </footer>
  );
};

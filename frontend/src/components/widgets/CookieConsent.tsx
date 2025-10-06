import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'kli.cookie-consent';

type Preference = 'all' | 'essential';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const savePreference = (choice: Preference) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
        <h3 className="text-lg font-semibold text-white">{t('cookie.title')}</h3>
        <p className="mt-2 text-sm text-white/80">{t('cookie.description')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => savePreference('all')}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-300"
          >
            {t('cookie.acceptAll')}
          </button>
          <button
            type="button"
            onClick={() => savePreference('essential')}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            {t('cookie.acceptEssential')}
          </button>
        </div>
      </div>
    </div>
  );
};

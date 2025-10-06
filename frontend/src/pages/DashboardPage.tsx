import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import { TranslationForm } from '../components/forms/TranslationForm';
import { downloadTranslation } from '../api/translation';
import type { TranslationRecord } from '../types/translation';

const formatCurrency = (value: number) => `${value.toFixed(2)} €`;

const StatsCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
    <p className="text-sm text-white/70">{title}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { data: translations, isLoading } = useTranslations();

  const stats = useMemo(() => {
    if (!translations) {
      return { totalChars: 0, totalCost: 0, completed: 0 };
    }
    const totals = translations.reduce(
      (acc, item) => {
        acc.totalChars += item.characterCount;
        acc.totalCost += item.priceCents / 100;
        if (item.status === 'completed') acc.completed += 1;
        return acc;
      },
      { totalChars: 0, totalCost: 0, completed: 0 }
    );
    return totals;
  }, [translations]);

  const handleDownload = async (translation: TranslationRecord) => {
    if (!tokens?.accessToken || translation.status !== 'completed') return;
    const blob = await downloadTranslation(translation.id, tokens.accessToken);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = translation.translatedFilename ?? `${translation.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 md:grid-cols-3">
        <StatsCard title={t('dashboard.statsTranslations')} value={String(stats.completed)} />
        <StatsCard title={t('dashboard.statsCharacters')} value={stats.totalChars.toLocaleString()} />
        <StatsCard title={t('dashboard.statsCost')} value={formatCurrency(stats.totalCost)} />
      </section>

      <TranslationForm />

      <section className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 text-lg font-semibold text-white">
          {t('dashboard.actions.new')}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading && <p className="p-6 text-white/60">Loading…</p>}
          {!isLoading && translations && translations.length === 0 && (
            <p className="p-6 text-white/60">{t('dashboard.noTranslations')}</p>
          )}
          {!isLoading && translations && translations.length > 0 && (
            <table className="min-w-full text-sm text-white/80">
              <thead>
                <tr className="bg-white/10 text-left uppercase text-xs tracking-wide text-white/60">
                  <th className="px-6 py-3">{t('dashboard.model')}</th>
                  <th className="px-6 py-3">{t('dashboard.characters')}</th>
                  <th className="px-6 py-3">{t('dashboard.cost')}</th>
                  <th className="px-6 py-3">{t('dashboard.status')}</th>
                  <th className="px-6 py-3">{t('dashboard.created')}</th>
                  <th className="px-6 py-3">{t('dashboard.download')}</th>
                </tr>
              </thead>
              <tbody>
                {translations.map((translation) => (
                  <tr key={translation.id} className="border-t border-white/10">
                    <td className="px-6 py-3">{translation.modelKey}</td>
                    <td className="px-6 py-3">{translation.characterCount.toLocaleString()}</td>
                    <td className="px-6 py-3">{formatCurrency(translation.priceCents / 100)}</td>
                    <td className="px-6 py-3">{t(`status.${translation.status}`)}</td>
                    <td className="px-6 py-3">{new Date(translation.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {translation.status === 'completed' ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(translation)}
                          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-900"
                        >
                          {t('dashboard.download')}
                        </button>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

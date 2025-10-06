import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'kli.onboarding.completed';

export const OnboardingModal = () => {
  const { t } = useTranslation();
  const steps = t('onboarding.steps', { returnObjects: true }) as string[];
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!open) return null;

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/90 p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">{t('onboarding.title')}</h2>
        <p className="mt-4 text-slate-700">{steps[step]}</p>
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0}
          >
            {t('onboarding.back')}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
            >
              {t('onboarding.next')}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-900"
              onClick={close}
            >
              {t('onboarding.finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

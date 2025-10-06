import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTranslationModels } from '../../hooks/useTranslationModels';
import { useCharacterCount } from '../../hooks/useCharacterCount';
import {
  createSubscriptionCheckout,
  createTranslation,
  createTranslationCheckout,
  type CreateTranslationPayload
} from '../../api/translation';
import type { ModelDescriptor } from '../../types/translation';

const languages = [
  'auto',
  'DE',
  'EN',
  'FR',
  'ES',
  'IT',
  'PL',
  'NL',
  'DA',
  'FI',
  'SV',
  'UK',
  'RU'
];

const formalityOptions = [
  { value: '', label: 'Default' },
  { value: 'more', label: 'More formal' },
  { value: 'less', label: 'Less formal' },
  { value: 'prefer_more', label: 'Prefer more' },
  { value: 'prefer_less', label: 'Prefer less' }
];

interface FormValues {
  sourceLang: string;
  targetLang: string;
  modelKey: string;
  stripTags: boolean;
  formality: string;
  glossary?: string;
}

const unitSize = 1860;

const estimatePrice = (model: ModelDescriptor, characters: number, discount = 0) => {
  if (!characters) return 0;
  const units = Math.max(1, characters / unitSize);
  const base = units * model.pricePer1860;
  return base * (1 - discount);
};

export const TranslationForm = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tokens, user } = useAuth();
  const { data: models } = useTranslationModels();
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelDescriptor | null>(null);
  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      sourceLang: 'auto',
      targetLang: 'DE',
      modelKey: 'kaminskyi-basic',
      stripTags: true,
      formality: ''
    }
  });
  const watchModel = watch('modelKey');
  const watchStripTags = watch('stripTags');
  const watchTarget = watch('targetLang');

  const discount = user?.subscriptionStatus === 'premium' ? 0.2 : 0;

  const { characters } = useCharacterCount(file, watchStripTags);

  const createMutation = useMutation((payload: CreateTranslationPayload) => {
    if (!tokens?.accessToken) throw new Error('Not authenticated');
    return createTranslation(payload, tokens.accessToken);
  }, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['translations'] });
    }
  });

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      // Simulate upload progress for UX feedback
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 50);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!file || !tokens?.accessToken || !models) return;
    const payload: CreateTranslationPayload = {
      file,
      sourceLang: values.sourceLang === 'auto' ? '' : values.sourceLang,
      targetLang: values.targetLang,
      modelKey: values.modelKey,
      stripTags: values.stripTags,
      options: {
        formality: values.formality,
        glossary_id: values.glossary
      }
    };

    const response = await createMutation.mutateAsync(payload);

    const session = await createTranslationCheckout(
      response.translation.id,
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/dashboard`,
      tokens.accessToken
    );

    if (session.url) {
      window.location.href = session.url;
    }
    reset({ ...values });
    setFile(null);
  };

  const handleSubscribe = async () => {
    if (!tokens?.accessToken) return;
    const session = await createSubscriptionCheckout(
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/dashboard`,
      tokens.accessToken
    );
    if (session.url) {
      window.location.href = session.url;
    }
  };

  if (!models) {
    return <div className="text-white/60">Loading models…</div>;
  }

  const currentModel = selectedModel ?? models.find((m) => m.key === watchModel) ?? models[0];
  const price = currentModel ? estimatePrice(currentModel, characters, discount) : 0;

  return (
    <form
      className="glass-card flex flex-col gap-6 p-8"
      onSubmit={handleSubmit((values) => onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/70">{t('translationForm.sourceLang')}</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white"
            {...register('sourceLang')}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang} className="text-slate-900">
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">{t('translationForm.targetLang')}</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white"
            {...register('targetLang')}
          >
            {languages
              .filter((lang) => lang !== 'auto')
              .map((lang) => (
                <option key={lang} value={lang} className="text-slate-900">
                  {lang}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">{t('translationForm.model')}</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white"
            {...register('modelKey')}
            onChange={(event) => {
              const model = models.find((m) => m.key === event.target.value) ?? null;
              setSelectedModel(model);
            }}
          >
            {models.map((model) => (
              <option key={model.key} value={model.key} className="text-slate-900">
                {model.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">{t('translationForm.formality')}</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white"
            {...register('formality')}
          >
            {formalityOptions.map((option) => (
              <option key={option.value} value={option.value} className="text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 text-sm text-white/80">
          <input type="checkbox" className="mt-1" {...register('stripTags')} />
          {t('translationForm.stripTags')}
        </label>
        <div>
          <label className="text-sm text-white/70">{t('translationForm.glossary')}</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white"
            {...register('glossary')}
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-white/70">{t('translationForm.file')}</label>
        <input
          type="file"
          accept=".pdf,.docx,.epub,.txt"
          required
          onChange={handleFileChange}
          className="mt-1 w-full rounded-xl border border-dashed border-white/30 bg-slate-950/30 px-4 py-6 text-sm text-white/70 hover:border-accent/50 transition-colors"
        />
        {file && (
          <div className="mt-2">
            <p className="text-xs text-white/60 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {file.name} · {Math.round(file.size / 1024)} KB · {t('translationForm.characters')}: {characters}
            </p>
            {uploadProgress < 100 && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">{t('translationForm.price')}</h3>
        <p className="text-3xl font-bold text-accent">{price.toFixed(2)} €</p>
        <p className="text-sm text-white/70">
          {characters} {t('translationForm.characters')} · {currentModel?.pricePer1860.toFixed(2)} € / 1860
        </p>
        {discount > 0 && (
          <p className="mt-1 text-sm text-emerald-300">{t('translationForm.premiumHint')}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        {user?.subscriptionStatus !== 'premium' && (
          <button
            type="button"
            onClick={handleSubscribe}
            className="rounded-full border border-secondary px-5 py-3 text-sm font-semibold text-secondary hover:bg-secondary/10"
          >
            {t('subscription.cta')}
          </button>
        )}
        <button
          type="submit"
          disabled={!file || createMutation.isPending}
          className="ml-auto rounded-full bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary/80 disabled:opacity-50 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
        >
          {createMutation.isPending ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing…
            </>
          ) : (
            <>
              {`${t('translationForm.submit')} (${watchTarget})`}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
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
          className="mt-1 w-full rounded-xl border border-dashed border-white/30 bg-slate-950/30 px-4 py-6 text-sm text-white/70"
        />
        {file && (
          <p className="mt-2 text-xs text-white/60">
            {file.name} · {Math.round(file.size / 1024)} KB · {t('translationForm.characters')}: {characters}
          </p>
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
          className="ml-auto rounded-full bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary/80 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Processing…' : `${t('translationForm.submit')} (${watchTarget})`}
        </button>
      </div>
    </form>
  );
};

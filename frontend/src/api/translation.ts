import type { ModelDescriptor, TranslationRecord } from '../types/translation';
import { apiRequest, API_URL } from './client';

export const getModels = () => apiRequest<ModelDescriptor[]>('/api/v1/models');

export const getTranslations = (token: string) =>
  apiRequest<TranslationRecord[]>('/api/v1/translations', { method: 'GET' }, token);

export interface CreateTranslationPayload {
  file: File;
  sourceLang: string;
  targetLang: string;
  modelKey: string;
  options?: Record<string, unknown>;
  stripTags?: boolean;
}

export const createTranslation = (payload: CreateTranslationPayload, token: string) => {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('sourceLang', payload.sourceLang);
  form.append('targetLang', payload.targetLang);
  form.append('modelKey', payload.modelKey);
  if (payload.options) {
    form.append('options', JSON.stringify(payload.options));
  }
  form.append('stripTags', String(Boolean(payload.stripTags)));
  return apiRequest<{ translation: TranslationRecord; model: ModelDescriptor }>(
    '/api/v1/translations',
    {
      method: 'POST',
      body: form
    },
    token
  );
};

export interface CheckoutSession {
  id: string;
  url: string;
}

export const createTranslationCheckout = (
  translationId: string,
  successUrl: string,
  cancelUrl: string,
  token: string
) =>
  apiRequest<CheckoutSession>('/api/v1/payments/translations', {
    method: 'POST',
    body: JSON.stringify({ translationId, successUrl, cancelUrl })
  }, token);

export const createSubscriptionCheckout = (
  successUrl: string,
  cancelUrl: string,
  token: string
) =>
  apiRequest<CheckoutSession>('/api/v1/payments/subscription', {
    method: 'POST',
    body: JSON.stringify({ successUrl, cancelUrl })
  }, token);

export const downloadTranslation = async (id: string, token: string) => {
  const endpoint = `/api/v1/translations/${id}/download` as const;
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.blob();
};

export type TranslationStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

export interface TranslationRecord {
  id: string;
  userId: string;
  sourceLang: string;
  targetLang: string;
  modelKey: string;
  characterCount: number;
  priceCents: number;
  currency: string;
  status: TranslationStatus;
  originalFilename: string;
  translatedFilename?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDescriptor {
  key: string;
  displayName: string;
  provider: string;
  tier: string;
  pricePer1860: number;
  currency: string;
  features: string[];
  options: Record<string, string>;
  maxCharacters: number;
  speedScore: number;
  accuracyScore: number;
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'EN', name: 'English' },
  { code: 'UK', name: 'Українська' },
  { code: 'PL', name: 'Polski' },
  { code: 'FR', name: 'Français' },
  { code: 'ES', name: 'Español' },
  { code: 'IT', name: 'Italiano' },
];

interface QuickTranslateResponse {
  id: string;
  text: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  charCount: number;
  downloadUrl: string;
  expiresAt: string;
}

export const QuickTranslatePage = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('EN');
  const [result, setResult] = useState<QuickTranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const charCount = text.length;
  const charLimit = 5000;
  const isOverLimit = charCount > charLimit;

  const handleTranslate = async () => {
    if (!text.trim() || isOverLimit) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/quick/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Translation failed');
      }

      const data: QuickTranslateResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.translation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${result.targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.translation);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError('');
  };

  return (
    <div className="flex flex-col gap-8 text-white">
      {/* Header */}
      <section className="glass-card px-6 py-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
          {t('quick.title', 'Quick Translate')}
        </h1>
        <p className="mt-3 text-white/70">
          {t('quick.subtitle', 'Fast, free translation without registration. Up to 5,000 characters.')}
        </p>
      </section>

      {/* Translation Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-white/90">
              {t('quick.sourceText', 'Source Text')}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/20 px-3 py-1 text-sm text-white focus:border-accent focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('quick.placeholder', 'Enter text to translate...')}
            className="w-full h-64 rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white placeholder-white/40 focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none resize-none"
            maxLength={charLimit}
          />

          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm ${isOverLimit ? 'text-rose-400' : 'text-white/60'}`}>
              {charCount} / {charLimit}
            </span>
            {text && (
              <button
                onClick={handleClear}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {t('quick.clear', 'Clear')}
              </button>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-white/90">
              {t('quick.translation', 'Translation')}
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="rounded-lg bg-white/10 border border-white/20 px-3 py-1 text-sm text-white focus:border-accent focus:outline-none"
            >
              {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full h-64 rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 overflow-y-auto">
            {result ? (
              <p className="text-white whitespace-pre-wrap">{result.translation}</p>
            ) : (
              <p className="text-white/40 italic">
                {t('quick.resultPlaceholder', 'Translation will appear here...')}
              </p>
            )}
          </div>

          {result && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-all"
              >
                📋 {t('quick.copy', 'Copy')}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300 transition-all"
              >
                ⬇️ {t('quick.download', 'Download')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Translate Button */}
      <div className="glass-card p-6">
        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          onClick={handleTranslate}
          disabled={!text.trim() || isOverLimit || isLoading}
          className="w-full rounded-full bg-gradient-to-r from-accent to-sky-400 px-8 py-4 text-lg font-semibold text-slate-900 hover:shadow-2xl hover:shadow-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('quick.translating', 'Translating...')}
            </>
          ) : (
            <>
              ✨ {t('quick.translateNow', 'Translate Now')}
            </>
          )}
        </button>

        {/* CTA to Register */}
        {result && (
          <div className="mt-6 text-center">
            <p className="text-sm text-white/60 mb-3">
              {t('quick.cta', 'Want unlimited translations and more features?')}
            </p>
            <Link
              to="/register"
              className="inline-block rounded-full bg-gradient-to-r from-secondary to-purple-600 px-6 py-3 text-base font-semibold text-white hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 hover:scale-105"
            >
              {t('quick.signUp', 'Sign Up Free')} →
            </Link>
          </div>
        )}

        {/* Limitations */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white/90 mb-3">
            {t('quick.limitations', 'Free Version Limitations:')}
          </h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <span className="text-rose-400">✗</span>
              {t('quick.limit1', 'No file uploads (text only)')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-400">✗</span>
              {t('quick.limit2', 'No translation history')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-400">✗</span>
              {t('quick.limit3', 'Basic model only')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-400">✗</span>
              {t('quick.limit4', 'Results expire after 1 hour')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

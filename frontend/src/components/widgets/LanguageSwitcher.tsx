import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' }
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      aria-label="Language selector"
      value={i18n.language}
      onChange={(event) => i18n.changeLanguage(event.target.value)}
      className="rounded-xl bg-white/20 text-white px-4 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code} className="text-slate-900">
          {lang.label}
        </option>
      ))}
    </select>
  );
};

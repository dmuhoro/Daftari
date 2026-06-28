import { useStore } from '../lib/store';
import sw from '../i18n/sw.json';
import en from '../i18n/en.json';

export type TranslationKey = keyof typeof sw;

const translations = { sw, en } as const;

export function useTranslation() {
  const language = useStore((s) => s.language);
  const dict = translations[language] ?? translations.sw;

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text = (dict as Record<string, string>)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  return { t, language };
}

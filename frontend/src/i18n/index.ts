import tr from './tr';
import en from './en';

export type Locale = 'tr' | 'en';

const locales = { tr, en } as const;

let currentLocale: Locale = (localStorage.getItem('locale') as Locale) || 'tr';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}

export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  let value: any = locales[currentLocale];

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path;
    }
  }

  if (typeof value !== 'string') {
    return path;
  }

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
      value
    );
  }

  return value;
}

export function useTranslation() {
  return { t, locale: getLocale(), setLocale };
}

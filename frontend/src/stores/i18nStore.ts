import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';

type Language = 'tr' | 'en';

type Translations = typeof tr;

interface I18nState {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const translations = {
  tr,
  en,
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'tr',
      t: (path: string) => {
        const lang = get().language;
        const keys = path.split('.');
        let current: any = translations[lang];
        
        for (const key of keys) {
          if (current === undefined || current === null) return path;
          current = current[key];
        }
        
        return current || path;
      },
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'tr' ? 'en' : 'tr' })),
    }),
    {
      name: 'i18n-storage',
    }
  )
);

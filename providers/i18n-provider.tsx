'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import { I18N_LANGUAGES } from '@/i18n/config';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '@/i18n/messages/en.json';
import frTranslations from '@/i18n/messages/fr.json';

const resources = {
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
};

// Initialize i18n synchronously to prevent hydration mismatches
// This ensures that the server renders with strings instead of keys
if (!i18n.isInitialized) {
  const i18nInstance = i18n.use(initReactI18next);

  // Note: We use LanguageDetector only on the client.
  // To avoid hydration mismatch where server uses 'en' and client detects 'fr' immediately,
  // we initialize both with 'en' and then detect language in a useEffect.
  i18nInstance.init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Force English on initial render to match SSR
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Important for Next.js SSR
    },
  });
}

interface I18nProviderProps {
  children: ReactNode;
}

function I18nProvider({ children }: I18nProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // After hydration, apply the detected language locally using our logic or LanguageDetector logic
    setIsHydrated(true);

    // Initialize browser language detector manually or just check localStorage/navigator
    const storedLang = localStorage.getItem('language');
    const browserLang = navigator.language.split('-')[0];
    const detectedLang = storedLang || (['en', 'fr'].includes(browserLang) ? browserLang : 'en');

    if (i18n.language !== detectedLang) {
      i18n.changeLanguage(detectedLang);
    }

    // Update document direction when language changes
    const handleLanguageChange = (lng: string) => {
      const language = I18N_LANGUAGES.find((lang) => lang.code === lng);
      if (language?.direction) {
        document.documentElement.setAttribute('dir', language.direction);
      }
    };

    // Set initial direction
    if (i18n.language) {
      handleLanguageChange(i18n.language);
    }

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Get current language for direction
  const currentLanguage =
    I18N_LANGUAGES.find((lang) => lang.code === (i18n.language || 'en')) ||
    I18N_LANGUAGES[0];

  // During SSR and initial hydration, render children seamlessly to avoid mismatch
  // By this time, `i18n` is initialized as 'en'.
  return (
    <I18nextProvider i18n={i18n}>
      <RadixDirectionProvider dir={currentLanguage.direction}>
        {children}
      </RadixDirectionProvider>
    </I18nextProvider>
  );
}

const useLanguage = () => {
  const currentLanguage = I18N_LANGUAGES.find((lang) => lang.code === i18n.language) || I18N_LANGUAGES[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  return {
    languageCode: i18n.language,
    language: currentLanguage,
    changeLanguage,
  };
};

export { I18nProvider, useLanguage };

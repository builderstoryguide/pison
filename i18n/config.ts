// src/config/languages.ts
export interface Language {
  code: string;
  name: string;
  shortName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const I18N_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    shortName: 'EN',
    direction: 'ltr',
    flag: '/media/flags/united-states.svg',
  },
  {
    code: 'fr',
    name: 'Français',
    shortName: 'FR',
    direction: 'ltr',
    flag: '/media/flags/france.svg',
  },
];

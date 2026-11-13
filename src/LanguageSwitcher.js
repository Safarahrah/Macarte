import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}
      title={currentLang === 'fr' ? 'Switch to English' : 'Passer au français'}
    >
      <span className="text-action dark:text-action-dark font-semibold">
        {currentLang === 'fr' ? 'EN' : 'FR'}
      </span>
    </button>
  );
}

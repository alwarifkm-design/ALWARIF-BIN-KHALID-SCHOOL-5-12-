import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'school_language'

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {
    // localStorage not available
  }
  return 'ar'
}

function applyLanguageToDOM(lang) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  document.documentElement.dir = dir
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const lang = getInitialLanguage()
    applyLanguageToDOM(lang)
    return lang
  })

  const setLang = useCallback((lang) => {
    if (lang !== 'ar' && lang !== 'en') return
    setLanguage(lang)
    applyLanguageToDOM(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // localStorage not available
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLang(language === 'ar' ? 'en' : 'ar')
  }, [language, setLang])

  const t = useCallback((key) => {
    if (!key) return key
    const keys = key.split('.')
    let value = translations[language]
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }
    return typeof value === 'string' ? value : key
  }, [language])

  const dir = language === 'ar' ? 'rtl' : 'ltr'

  const value = {
    language,
    dir,
    t,
    setLang,
    toggleLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export default LanguageContext

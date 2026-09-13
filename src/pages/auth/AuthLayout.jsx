import React from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { base44Client } from '../../api/base44Client.js'
import logoUrl from '../../../1.png'

export default function AuthLayout({ title, description, children }) {
  const { t, language, toggleLanguage } = useLanguage()
  const schoolSettings = base44Client.auth.getSchoolSettings()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 end-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
      >
        🌐 {language === 'ar' ? 'EN' : 'ع'}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo & School Name */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logoUrl}
            alt="School Logo"
            className="w-16 h-16 object-contain mb-3"
          />
          <h1 className="text-xl font-bold font-cairo text-foreground">
            {language === 'ar' ? (schoolSettings.school_name || t('common.school_name')) : (schoolSettings.school_name_en || t('common.school_name_en'))}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'ar' ? (schoolSettings.school_subtitle || t('common.school_subtitle')) : (schoolSettings.school_subtitle_en || t('common.school_subtitle_en'))}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          {title && (
            <div className="mb-5">
              <h2 className="text-lg font-bold font-cairo text-foreground">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

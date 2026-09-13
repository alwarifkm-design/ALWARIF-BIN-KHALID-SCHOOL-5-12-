import React from 'react'
import { LogOut, Globe, User } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { base44Client } from '../../api/base44Client.js'
import logoUrl from '../../../1.png'

export default function Header() {
  const { t, language, toggleLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const schoolSettings = base44Client.auth.getSchoolSettings()

  return (
    <header className="no-print sticky top-0 z-40 h-16 bg-card border-b border-border shadow-sm flex items-center px-4 md:px-6 gap-4">
      {/* Logo + School Name */}
      <div className="flex items-center gap-3 flex-1">
        <img
          src={logoUrl}
          alt="School Logo"
          className="w-10 h-10 object-contain flex-shrink-0"
        />
        <div className="hidden sm:block">
          <p className="text-sm font-bold font-cairo text-foreground leading-tight">
            {language === 'ar' ? (schoolSettings.school_name || t('common.school_name')) : (schoolSettings.school_name_en || t('common.school_name_en'))}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            {language === 'ar' ? (schoolSettings.school_subtitle || t('common.school_subtitle')) : (schoolSettings.school_subtitle_en || t('common.school_subtitle_en'))}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          title={t('common.language')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'EN' : 'ع'}</span>
        </button>

        {/* User info */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>{user.name || user.email || t('common.user')}</span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title={t('common.logout')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('common.logout')}</span>
        </button>
      </div>
    </header>
  )
}

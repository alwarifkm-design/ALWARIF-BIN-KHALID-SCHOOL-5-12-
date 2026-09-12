import React from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'

export default function ConfirmDialog({ open, onConfirm, onCancel, title, description }) {
  const { t } = useLanguage()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-bold font-cairo text-foreground">
          {title || t('common.confirm_delete')}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <p className="text-xs text-muted-foreground">{t('common.delete_warning')}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

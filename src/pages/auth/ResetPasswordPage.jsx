import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { base44Client } from '../../api/base44Client.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import AuthLayout from './AuthLayout.jsx'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthLayout title={t('auth.reset_title')}>
        <div className="space-y-4">
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 text-center">
            {t('auth.invalid_token')}
          </div>
          <Link to="/forgot-password" className="block text-center text-sm text-primary hover:underline">
            {t('auth.send_reset_link')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError(t('auth.password_too_short')); return }
    if (form.password !== form.confirm) { setError(t('auth.passwords_dont_match')); return }
    setLoading(true)
    try {
      await base44Client.auth.resetPassword(token, form.password)
      navigate('/login', { replace: true })
    } catch {
      setError(t('auth.invalid_token'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={t('auth.reset_title')} description={t('auth.reset_subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.new_password')}</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('auth.password_placeholder')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.confirm_password')}</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder={t('auth.confirm_password_placeholder')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('common.loading') : t('auth.reset_button')}
        </button>
      </form>
    </AuthLayout>
  )
}

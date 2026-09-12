import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import AuthLayout from './AuthLayout.jsx'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const { resetByManagerCode } = useAuth()
  const [form, setForm] = useState({ email: '', managerCode: '', newPassword: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email) {
      setError('يجب إدخال البريد الإلكتروني')
      return
    }

    if (!codeVerified) {
      if (!form.managerCode) {
        setError('أدخل كود المدير لتأكيد العملية')
        return
      }

      setLoading(true)
      try {
        await resetByManagerCode({
          email: form.email,
          managerCode: form.managerCode,
          newPassword: 'Temp@1234',
        })
        setCodeVerified(true)
        setError('')
      } catch (err) {
        setError(err.message || 'كود المدير غير صحيح')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!form.newPassword) {
      setError('أدخل كلمة المرور الجديدة')
      return
    }

    setLoading(true)
    try {
      await resetByManagerCode({
        email: form.email,
        managerCode: form.managerCode,
        newPassword: form.newPassword,
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="إعادة تعيين كلمة المرور" description="أدخل البريد وكود المدير فقط ليتم تحديث كلمة المرور">
      {done ? (
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-md px-4 py-3 text-sm text-foreground text-center">
            تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن.
          </div>
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">
            {t('auth.back_to_login')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@school.edu.om"
                className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">كود المدير السري</label>
            <div className="relative">
              <ShieldCheck className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={form.managerCode}
                onChange={(e) => setForm({ ...form, managerCode: e.target.value })}
                placeholder="اكتب كود المدير"
                className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {codeVerified && (
            <div>
              <label className="block text-sm font-medium mb-1.5">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="كلمة مرور جديدة"
                  className="w-full ps-10 pe-10 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

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
            {loading ? t('common.loading') : codeVerified ? 'تحديث كلمة المرور' : 'تأكيد الكود'}
          </button>

          <Link to="/login" className="block text-center text-xs text-primary hover:underline">
            {t('auth.back_to_login')}
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}

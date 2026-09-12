import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { base44Client } from '../../api/base44Client.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import AuthLayout from './AuthLayout.jsx'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export default function RegisterPage() {
  const { t } = useLanguage()
  const [step, setStep] = useState('register') // 'register' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', registration_code: '' })
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const otpRefs = useRef([])

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = t('common.required')
    if (!form.email.trim()) errs.email = t('common.required')
    if (!form.registration_code.trim()) errs.registration_code = 'يجب إدخال كود التسجيل'
    if (!form.password) errs.password = t('common.required')
    else if (form.password.length < 8) errs.password = t('auth.password_too_short')
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('auth.passwords_dont_match')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      await base44Client.auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
        registration_code: form.registration_code,
      })
      setStep('otp')
      startCountdown()
    } catch (err) {
      setErrors({ general: err.message || t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== OTP_LENGTH) return
    setLoading(true)
    try {
      await base44Client.auth.verifyOtp(code)
      window.location.href = '/'
    } catch {
      setErrors({ otp: t('auth.otp_invalid') })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await base44Client.auth.resendOtp()
      startCountdown()
      setErrors({})
    } catch (err) {
      setErrors({ otp: err.message || t('common.error') })
    }
  }

  if (step === 'otp') {
    return (
      <AuthLayout title={t('auth.otp_title')} description={t('auth.otp_subtitle')}>
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.otp_sent_to')} <span className="font-medium text-foreground">{form.email}</span>
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center" dir="ltr">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-bold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
          </div>

          {errors.otp && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 text-center">
              {errors.otp}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            className="w-full px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('auth.verify_button')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="w-full text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0
              ? `${t('auth.resend_countdown')} ${countdown} ${t('auth.seconds')}`
              : t('auth.resend_otp')}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.register_title')} description={t('auth.register_subtitle')}>
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.full_name')}</label>
          <div className="relative">
            <User className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('auth.full_name_placeholder')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('auth.email_placeholder')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        {/* Registration Code */}
        <div>
          <label className="block text-sm font-medium mb-1.5">كود التسجيل</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={form.registration_code}
              onChange={(e) => setForm({ ...form, registration_code: e.target.value.toUpperCase() })}
              placeholder="ABC"
              className="w-full ps-10 pe-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">يُولد من المدير ويظل صالحاً 5 دقائق فقط.</p>
          {errors.registration_code && <p className="text-xs text-destructive mt-1">{errors.registration_code}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('auth.password_placeholder')}
              className="w-full ps-10 pe-10 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.confirm_password')}</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder={t('auth.confirm_password_placeholder')}
              className="w-full ps-10 pe-10 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
        </div>

        {errors.general && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('common.loading') : t('auth.register_button')}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {t('auth.already_have_account')}{' '}
          <Link to="/login" className="text-primary hover:underline">{t('auth.sign_in')}</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

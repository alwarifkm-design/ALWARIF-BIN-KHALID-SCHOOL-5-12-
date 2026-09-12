import React, { useEffect, useMemo, useState } from 'react'
import { Globe, Plus, Pencil, Trash2, ShieldCheck, UserCog, Lock, Eye, EyeOff, KeyRound, Key } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { base44Client } from '../api/base44Client.js'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  role: 'supervisor',
  password: '',
  status: 'active',
}

export default function SettingsPage() {
  const { t, language, setLang } = useLanguage()
  const { user, listAccounts, createAccount, updateAccount, deleteAccount } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [managerSecret, setManagerSecret] = useState(base44Client.auth.getManagerSecretCode())
  const [registrationCode, setRegistrationCode] = useState(base44Client.auth.getRegistrationCode())
  const [showPasswords, setShowPasswords] = useState({})
  const [managerPassword, setManagerPassword] = useState('Admin@123')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    async function loadAccounts() {
      if (!isAdmin) {
        setAccounts([])
        setLoading(false)
        return
      }

      try {
        const result = await listAccounts()
        setAccounts(result || [])
      } catch {
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [isAdmin, listAccounts])

  const list = useMemo(() => accounts || [], [accounts])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const handleOpenEdit = (account) => {
    setEditingId(account.id)
    setForm({
      name: account.name || '',
      phone: account.phone || '',
      email: account.email || '',
      role: account.role || 'supervisor',
      password: '',
      status: account.status || 'active',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role || 'supervisor',
      status: form.status || 'active',
      ...(form.password ? { password: form.password } : {}),
    }

    if (!payload.name || !payload.email) return

    try {
      if (editingId) {
        await updateAccount(editingId, payload)
      } else {
        await createAccount(payload)
      }

      const fresh = await listAccounts()
      setAccounts(fresh || [])
      setFormOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      alert(err.message || 'حدث خطأ')
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    try {
      await deleteAccount(id)
      const fresh = await listAccounts()
      setAccounts(fresh || [])
    } catch (err) {
      alert(err.message || 'حدث خطأ')
    }
  }

  const handleGenerateRegistrationCode = () => {
    const nextCode = base44Client.auth.generateRegistrationCode()
    setRegistrationCode(nextCode)
  }

  const handleManagerSecretChange = () => {
    const next = base44Client.auth.setManagerSecretCode(managerSecret)
    setManagerSecret(next.manager_secret_code)
  }

  const handleManagerPasswordChange = async () => {
    if (!managerPassword || managerPassword.length < 8) {
      alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل')
      return
    }
    await base44Client.auth.setManagerPassword(managerPassword)
    alert('تم تحديث كلمة مرور المدير بنجاح')
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-cairo text-foreground">إدارة الحسابات</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          هذه الصفحة خاصة بالمدير فقط. لا يحق للمشرف الوصول إلى إدارة الحسابات.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-cairo text-foreground">{t('settings.title') || 'الإعدادات'}</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-cairo text-foreground">{t('settings.language_settings') || 'إعدادات اللغة'}</h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{t('settings.language_description') || 'اختر لغة واجهة النظام'}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
              language === 'ar' ? 'border-primary bg-primary text-white' : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
              language === 'en' ? 'border-primary bg-primary text-white' : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            English
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-cairo text-foreground">إعدادات المدير</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-2 block text-sm font-medium text-foreground">كود المدير السري</label>
            <div className="flex gap-2">
              <input
                value={managerSecret}
                onChange={(e) => setManagerSecret(e.target.value)}
                className="input-base flex-1"
              />
              <button type="button" onClick={handleManagerSecretChange} className="rounded-md bg-primary px-3 py-2 text-sm text-white">حفظ</button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-2 block text-sm font-medium text-foreground">كلمة مرور المدير</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                className="input-base flex-1"
              />
              <button type="button" onClick={handleManagerPasswordChange} className="rounded-md bg-primary px-3 py-2 text-sm text-white">تحديث</button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-foreground">كود تسجيل الحسابات الجديد</label>
            <button type="button" onClick={handleGenerateRegistrationCode} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">توليد كود جديد</button>
          </div>
          {registrationCode ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span><strong>{registrationCode.code}</strong> صالح حتى {new Date(registrationCode.expiresAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">لا يوجد كود نشط حالياً.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-cairo text-foreground">إدارة الحسابات</h2>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="w-4 h-4" />
            إضافة حساب
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted-foreground">
                <th className="px-3 py-2 font-medium">الاسم</th>
                <th className="px-3 py-2 font-medium">البريد</th>
                <th className="px-3 py-2 font-medium">الدور</th>
                <th className="px-3 py-2 font-medium">كلمة المرور</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                <th className="px-3 py-2 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-muted-foreground">جارٍ التحميل...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-muted-foreground">لا توجد حسابات</td>
                </tr>
              ) : (
                list.map((account) => (
                  <tr key={account.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{account.name || '—'}</td>
                    <td className="px-3 py-2">{account.email || '—'}</td>
                    <td className="px-3 py-2">{account.role === 'admin' ? 'مدير' : 'مشرف'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {showPasswords[account.id] ? (account.plain_password || '••••••••') : '••••••••'}
                        </span>
                        <button type="button" onClick={() => setShowPasswords((prev) => ({ ...prev, [account.id]: !prev[account.id] }))} className="text-muted-foreground">
                          {showPasswords[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">{account.status === 'active' ? 'نشط' : 'غير نشط'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(account)}
                          className="rounded-md border border-border bg-background p-2 text-foreground hover:bg-muted"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {account.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(account.id)}
                            className="rounded-md border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold font-cairo text-foreground">
                {editingId ? 'تعديل الحساب' : 'إضافة حساب'}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">الاسم *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">الهاتف</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="input-base"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">البريد *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="input-base"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">الدور</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="input-base"
                >
                  <option value="supervisor">مشرف</option>
                  <option value="admin">مدير</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="input-base"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">كلمة المرور {editingId ? '(اختياري)' : '*'}</label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={editingId ? 'اتركه فارغاً للحفاظ على كلمة المرور الحالية' : 'كلمة المرور'}
                    className="input-base ps-10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground">
                إلغاء
              </button>
              <button type="button" onClick={handleSave} className="rounded-md bg-primary px-4 py-2 text-sm text-white">
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

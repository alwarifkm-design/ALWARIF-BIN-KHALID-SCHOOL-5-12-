import React, { useState, useMemo } from 'react'
import { ShieldAlert, Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react'
import { useViolations, useViolationMutations } from '../hooks/useViolations.js'
import { useStudents } from '../hooks/useStudents.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx'

// ─── ثوابت التصنيف ──────────────────────────────────────────────────────────
const VIOLATION_TYPES = {
  absence: 'غياب',
  behavior: 'سلوك',
  academic: 'دراسي',
  uniform: 'زي',
  other: 'أخرى',
}

const VIOLATION_TYPES_EN = {
  absence: 'Absence',
  behavior: 'Behavior',
  academic: 'Academic',
  uniform: 'Uniform',
  other: 'Other',
}

const SEVERITIES = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
}

const SEVERITIES_EN = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const STATUSES = {
  open: 'مفتوح',
  resolved: 'تم الحل',
  escalated: 'تم التصعيد',
}

const STATUSES_EN = {
  open: 'Open',
  resolved: 'Resolved',
  escalated: 'Escalated',
}

const EMPTY_FORM = {
  student_id: '',
  student_name: '',
  type: '',
  severity: 'low',
  date: '',
  description: '',
  status: 'open',
  reporter: '',
  action_taken: '',
}

// ─── مكوّن شارة الخطورة ──────────────────────────────────────────────────────
function SeverityBadge({ severity, lang }) {
  const label = lang === 'ar' ? SEVERITIES[severity] : SEVERITIES_EN[severity]
  if (severity === 'high')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
        {label}
      </span>
    )
  if (severity === 'medium')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
        {label}
      </span>
    )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 text-gray-600 bg-white">
      {label}
    </span>
  )
}

// ─── مكوّن شارة الحالة ────────────────────────────────────────────────────────
function StatusBadge({ status, lang }) {
  const label = lang === 'ar' ? STATUSES[status] : STATUSES_EN[status]
  if (status === 'open')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
        {label}
      </span>
    )
  if (status === 'resolved')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        {label}
      </span>
    )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
      {label}
    </span>
  )
}

// ─── Dialog المخالفة ─────────────────────────────────────────────────────────
function ViolationDialog({ open, onClose, editData, students, onSave, lang }) {
  const isAr = lang === 'ar'
  const [form, setForm] = useState(editData || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  // مزامنة النموذج عند تغيير editData
  React.useEffect(() => {
    if (open) {
      setForm(editData || EMPTY_FORM)
      setErrors({})
    }
  }, [open, editData])

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleStudentChange = (studentId) => {
    const student = students.find((s) => s.id === studentId)
    setForm((prev) => ({
      ...prev,
      student_id: studentId,
      student_name: student ? student.name : '',
    }))
    if (errors.student_id) setErrors((prev) => ({ ...prev, student_id: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.student_id) errs.student_id = isAr ? 'الطالب مطلوب' : 'Student is required'
    if (!form.type) errs.type = isAr ? 'النوع مطلوب' : 'Type is required'
    if (!form.date) errs.date = isAr ? 'التاريخ مطلوب' : 'Date is required'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
  }

  if (!open) return null

  const typesMap = isAr ? VIOLATION_TYPES : VIOLATION_TYPES_EN
  const severitiesMap = isAr ? SEVERITIES : SEVERITIES_EN
  const statusesMap = isAr ? STATUSES : STATUSES_EN

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* رأس النموذج */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold font-cairo text-foreground">
            {editData?.id
              ? isAr ? 'تعديل المخالفة' : 'Edit Violation'
              : isAr ? 'تسجيل مخالفة' : 'Record Violation'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* الطالب* */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الطالب' : 'Student'}
              <span className="text-red-600 ms-1">*</span>
            </label>
            <select
              className={`input-base ${errors.student_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : ''}`}
              value={form.student_id}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              <option value="">{isAr ? '— اختر طالباً —' : '— Select student —'}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="mt-1 text-xs text-red-600">{errors.student_id}</p>
            )}
          </div>

          {/* النوع* */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'النوع' : 'Type'}
              <span className="text-red-600 ms-1">*</span>
            </label>
            <select
              className={`input-base ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : ''}`}
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
            >
              <option value="">{isAr ? '— اختر النوع —' : '— Select type —'}</option>
              {Object.entries(typesMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-600">{errors.type}</p>
            )}
          </div>

          {/* الخطورة */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الخطورة' : 'Severity'}
            </label>
            <select
              className="input-base"
              value={form.severity}
              onChange={(e) => set('severity', e.target.value)}
            >
              {Object.entries(severitiesMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* التاريخ* */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'التاريخ' : 'Date'}
              <span className="text-red-600 ms-1">*</span>
            </label>
            <input
              type="date"
              className={`input-base ${errors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : ''}`}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-600">{errors.date}</p>
            )}
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الوصف' : 'Description'}
            </label>
            <textarea
              rows={3}
              className="input-base resize-none"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={isAr ? 'وصف المخالفة...' : 'Violation description...'}
            />
          </div>

          {/* الحالة */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الحالة' : 'Status'}
            </label>
            <select
              className="input-base"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {Object.entries(statusesMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* المبلّغ */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'المبلّغ' : 'Reported By'}
            </label>
            <input
              type="text"
              className="input-base"
              value={form.reporter}
              onChange={(e) => set('reporter', e.target.value)}
              placeholder={isAr ? 'اسم المبلّغ...' : 'Reporter name...'}
            />
          </div>

          {/* الإجراء المتخذ */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الإجراء المتخذ' : 'Action Taken'}
            </label>
            <textarea
              rows={2}
              className="input-base resize-none"
              value={form.action_taken}
              onChange={(e) => set('action_taken', e.target.value)}
              placeholder={isAr ? 'الإجراء المتخذ...' : 'Action taken...'}
            />
          </div>

          {/* أزرار */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md text-white font-medium transition-colors"
              style={{ backgroundColor: '#b91c1c' }}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Dialog تغيير الحالة ─────────────────────────────────────────────────────
function StatusChangeMenu({ violationId, currentStatus, onUpdate, lang }) {
  const [open, setOpen] = useState(false)
  const isAr = lang === 'ar'
  const statusesMap = isAr ? STATUSES : STATUSES_EN

  const handleSelect = (status) => {
    if (status !== currentStatus) {
      onUpdate({ id: violationId, status })
    }
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1 focus:outline-none"
        title={isAr ? 'تغيير الحالة' : 'Change status'}
      >
        <StatusBadge status={currentStatus} lang={lang} />
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute z-40 mt-1 bg-white border border-border rounded-md shadow-lg py-1 min-w-[120px]"
            style={{ [isAr ? 'right' : 'left']: 0 }}
          >
            {Object.entries(statusesMap).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => handleSelect(k)}
                className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors ${k === currentStatus ? 'font-semibold text-primary' : 'text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function ViolationsPage() {
  const { language: lang, t } = useLanguage()
  const isAr = lang === 'ar'

  // بيانات
  const { data: violations = [], isLoading: vLoading } = useViolations()
  const { data: students = [], isLoading: sLoading } = useStudents()
  const { create, update, remove } = useViolationMutations()

  // فلاتر
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  // حوار الحذف
  const [deleteId, setDeleteId] = useState(null)

  const typesMap = isAr ? VIOLATION_TYPES : VIOLATION_TYPES_EN
  const severitiesMap = isAr ? SEVERITIES : SEVERITIES_EN
  const statusesMap = isAr ? STATUSES : STATUSES_EN

  // ─── فلترة فورية ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return violations.filter((v) => {
      if (filterType && v.type !== filterType) return false
      if (filterSeverity && v.severity !== filterSeverity) return false
      if (filterStatus && v.status !== filterStatus) return false
      return true
    })
  }, [violations, filterType, filterSeverity, filterStatus])

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenNew = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  const handleEdit = (violation) => {
    setEditData(violation)
    setDialogOpen(true)
  }

  const handleSave = async (form) => {
    if (editData?.id) {
      await update.mutateAsync({ id: editData.id, ...form })
    } else {
      await create.mutateAsync(form)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await remove.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleStatusUpdate = ({ id, status }) => {
    update.mutate({ id, status })
  }

  const loading = vLoading || sLoading

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── شريط الأدوات ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* العنوان */}
        <div className="flex items-center gap-2">
          <ShieldAlert size={22} color="#b91c1c" />
          <h1 className="text-xl font-bold font-cairo text-foreground">
            {t('violations.title')}
          </h1>
        </div>

        {/* زر إضافة */}
        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white font-medium rounded-md transition-colors hover:opacity-90"
          style={{ backgroundColor: '#b91c1c' }}
        >
          <Plus size={16} />
          {t('violations.add_violation')}
        </button>
      </div>

      {/* ── الفلاتر ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* فلتر النوع */}
        <select
          className="input-base max-w-[160px]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label={t('violations.filter_type')}
        >
          <option value="">{isAr ? 'الكل — النوع' : 'All — Type'}</option>
          {Object.entries(typesMap).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* فلتر الخطورة */}
        <select
          className="input-base max-w-[160px]"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          aria-label={t('violations.filter_severity')}
        >
          <option value="">{isAr ? 'الكل — الخطورة' : 'All — Severity'}</option>
          {Object.entries(severitiesMap).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* فلتر الحالة */}
        <select
          className="input-base max-w-[160px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label={t('violations.filter_status')}
        >
          <option value="">{isAr ? 'الكل — الحالة' : 'All — Status'}</option>
          {Object.entries(statusesMap).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* عداد النتائج */}
        {!loading && (
          <span className="text-sm text-muted-foreground ms-auto">
            {filtered.length}{' '}
            {isAr ? (filtered.length === 1 ? 'مخالفة' : 'مخالفة') : 'violation(s)'}
          </span>
        )}
      </div>

      {/* ── الجدول ── */}
      <div className="bg-white border border-border rounded-lg overflow-x-auto shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground font-cairo">
            {t('common.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <ShieldAlert size={32} className="opacity-30" />
            <p className="text-sm font-cairo">{t('common.no_data')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground font-medium">
                <th className="px-4 py-3 text-start font-cairo">{t('violations.student')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('violations.type')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('violations.severity')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('common.date')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('violations.description')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('common.status')}</th>
                <th className="px-4 py-3 text-start font-cairo">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-muted/40 transition-colors">
                  {/* الطالب */}
                  <td className="px-4 py-3 font-bold font-cairo text-foreground whitespace-nowrap">
                    {v.student_name || '—'}
                  </td>

                  {/* النوع */}
                  <td className="px-4 py-3 text-foreground font-cairo whitespace-nowrap">
                    {typesMap[v.type] || v.type || '—'}
                  </td>

                  {/* الخطورة */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SeverityBadge severity={v.severity} lang={lang} />
                  </td>

                  {/* التاريخ */}
                  <td className="px-4 py-3 text-foreground font-cairo whitespace-nowrap">
                    {v.date || '—'}
                  </td>

                  {/* الوصف */}
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                    <span title={v.description}>
                      {v.description
                        ? v.description.length > 50
                          ? v.description.slice(0, 50) + '...'
                          : v.description
                        : '—'}
                    </span>
                  </td>

                  {/* الحالة — قابلة للتغيير */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusChangeMenu
                      violationId={v.id}
                      currentStatus={v.status || 'open'}
                      onUpdate={handleStatusUpdate}
                      lang={lang}
                    />
                  </td>

                  {/* الإجراءات */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(v)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title={t('common.edit')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(v.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Dialog المخالفة ── */}
      <ViolationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editData={editData}
        students={students}
        onSave={handleSave}
        lang={lang}
      />

      {/* ── حوار تأكيد الحذف ── */}
      <ConfirmDialog
        open={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={isAr ? 'حذف المخالفة' : 'Delete Violation'}
        description={
          isAr
            ? 'هل أنت متأكد من حذف هذه المخالفة؟'
            : 'Are you sure you want to delete this violation?'
        }
      />
    </div>
  )
}

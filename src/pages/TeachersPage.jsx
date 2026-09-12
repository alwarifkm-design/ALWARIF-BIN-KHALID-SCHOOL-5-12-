import React, { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, GraduationCap, Search } from 'lucide-react'
import { useTeachers, useTeacherMutations } from '../hooks/useTeachers.js'
import { useSubjects } from '../hooks/useSubjects.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx'

// ---- شارة الحالة ----
function StatusBadge({ status, t }) {
  const config = {
    active: {
      label: t('teachers.status_active'),
      cls: 'bg-green-100 text-green-800',
    },
    on_leave: {
      label: t('teachers.status_on_leave'),
      cls: 'bg-gray-100 text-gray-600',
    },
    inactive: {
      label: t('teachers.status_inactive'),
      cls: 'bg-gray-200 text-gray-500',
    },
  }
  const c = config[status] || config.active
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full font-cairo ${c.cls}`}>
      {c.label}
    </span>
  )
}

// ---- نموذج إضافة / تعديل معلم ----
function TeacherDialog({ open, teacher, subjects, onClose, onSave }) {
  const { t } = useLanguage()
  const isEdit = Boolean(teacher)

  const defaultForm = {
    name: '',
    email: '',
    phone: '',
    subject_ids: [],
    hire_date: '',
    status: 'active',
  }

  const [form, setForm] = useState(() => teacher
    ? {
        name: teacher.name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        subject_ids: teacher.subject_ids || [],
        hire_date: teacher.hire_date || '',
        status: teacher.status || 'active',
      }
    : { ...defaultForm }
  )
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (open) {
      setForm(teacher
        ? {
            name: teacher.name || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            subject_ids: teacher.subject_ids || [],
            hire_date: teacher.hire_date || '',
            status: teacher.status || 'active',
          }
        : { ...defaultForm }
      )
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher])

  const toggleSubject = (id) => {
    setForm(f => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter(s => s !== id)
        : [...f.subject_ids, id],
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = t('common.required')
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSave(form)
  }

  if (!open) return null

  const STATUS_OPTIONS = [
    { value: 'active', label: t('teachers.status_active') },
    { value: 'on_leave', label: t('teachers.status_on_leave') },
    { value: 'inactive', label: t('teachers.status_inactive') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold font-cairo text-foreground mb-5">
          {isEdit ? t('teachers.edit_teacher') : t('teachers.add_teacher')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* الاسم */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('teachers.teacher_name')} <span className="text-destructive">*</span>
            </label>
            <input
              className="input-base"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t('teachers.teacher_name')}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* البريد والهاتف */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('common.email')}
              </label>
              <input
                type="email"
                className="input-base"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@school.edu.om"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('common.phone')}
              </label>
              <input
                type="tel"
                className="input-base"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+968 9X XXX XXX"
                dir="ltr"
              />
            </div>
          </div>

          {/* تاريخ التعيين والحالة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('teachers.hire_date')}
              </label>
              <input
                type="date"
                className="input-base"
                value={form.hire_date}
                onChange={(e) => setForm(f => ({ ...f, hire_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('common.status')}
              </label>
              <select
                className="input-base"
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* المواد (checkboxes متعدد) */}
          {subjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-2">
                {t('teachers.subjects_taught')}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-3 bg-background">
                {subjects.map(subj => (
                  <label
                    key={subj.id}
                    className="flex items-center gap-2 text-sm font-cairo text-foreground cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={form.subject_ids.includes(subj.id)}
                      onChange={() => toggleSubject(subj.id)}
                      className="w-4 h-4 accent-[#065f46] rounded"
                    />
                    <span className="truncate">{subj.name_ar || subj.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* أزرار */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors font-cairo">
              {t('common.cancel')}
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm rounded-md text-white transition-colors font-cairo"
              style={{ backgroundColor: '#065f46' }}>
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- الصفحة الرئيسية ----
export default function TeachersPage() {
  const { t } = useLanguage()

  const { data: teachers = [], isLoading } = useTeachers()
  const { data: subjects = [] } = useSubjects()
  const { create, update, remove } = useTeacherMutations()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // خريطة id → name للمواد
  const subjectMap = useMemo(() => {
    return Object.fromEntries((subjects || []).map(s => [s.id, s.name_ar || s.name]))
  }, [subjects])

  // فلترة البحث
  const filtered = useMemo(() => {
    if (!search.trim()) return teachers
    const q = search.toLowerCase()
    return teachers.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.phone || '').includes(q)
    )
  }, [teachers, search])

  const handleAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const handleEdit = (teacher) => { setEditTarget(teacher); setDialogOpen(true) }

  const handleSave = async (data) => {
    if (editTarget) {
      await update.mutateAsync({ id: editTarget.id, ...data })
    } else {
      await create.mutateAsync(data)
    }
    setDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await remove.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground font-cairo">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">{t('teachers.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {teachers.length} {t('teachers.teacher_name')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-cairo text-white rounded-md transition-colors"
          style={{ backgroundColor: '#065f46' }}
        >
          <Plus size={16} />
          {t('teachers.add_teacher')}
        </button>
      </div>

      {/* شريط البحث */}
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          className="input-base ps-9"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* الجدول */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <GraduationCap size={48} className="opacity-30" />
          <p className="font-cairo">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white text-xs font-cairo" style={{ backgroundColor: '#065f46' }}>
                <th className="px-4 py-3 text-start font-semibold">{t('common.name')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('common.phone')}</th>
                <th className="px-4 py-3 text-start font-semibold hidden md:table-cell">{t('common.email')}</th>
                <th className="px-4 py-3 text-start font-semibold hidden lg:table-cell">{t('teachers.subjects_taught')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('common.status')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher, idx) => {
                const subjectNames = (teacher.subject_ids || [])
                  .map(id => subjectMap[id])
                  .filter(Boolean)

                return (
                  <tr
                    key={teacher.id}
                    className={`border-t border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                  >
                    {/* الاسم */}
                    <td className="px-4 py-3 font-medium font-cairo text-foreground">
                      {teacher.name}
                    </td>
                    {/* الهاتف */}
                    <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                      {teacher.phone || '—'}
                    </td>
                    {/* البريد */}
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell" dir="ltr">
                      {teacher.email || '—'}
                    </td>
                    {/* المواد */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {subjectNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {subjectNames.slice(0, 3).map((name, i) => (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 rounded font-cairo"
                              style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                            >
                              {name}
                            </span>
                          ))}
                          {subjectNames.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{subjectNames.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* الحالة */}
                    <td className="px-4 py-3">
                      <StatusBadge status={teacher.status} t={t} />
                    </td>
                    {/* الإجراءات */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          title={t('teachers.edit_teacher')}
                          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(teacher)}
                          title={t('teachers.delete_teacher')}
                          className="p-1.5 rounded-md border border-border text-red-400 hover:text-white hover:bg-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      <TeacherDialog
        open={dialogOpen}
        teacher={editTarget}
        subjects={subjects}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* حوار الحذف */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('teachers.delete_teacher')}
        description={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, BookMarked, Search } from 'lucide-react'
import { useSubjects, useSubjectMutations } from '../hooks/useSubjects.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx'

// ---- شارة نوع المادة ----
function SubjectTypeBadge({ isElective, t }) {
  if (isElective) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full font-cairo bg-amber-100 text-amber-700">
        {t('common.elective')}
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full font-cairo bg-emerald-100 text-emerald-700">
      {t('common.mandatory')}
    </span>
  )
}

// ---- نموذج إضافة / تعديل مادة ----
function SubjectDialog({ open, subject, onClose, onSave }) {
  const { t } = useLanguage()
  const isEdit = Boolean(subject)

  const defaultForm = {
    name_ar: '',
    name_en: '',
    grade: '',
    is_elective: false,
    hours_per_week: 3,
  }

  const [form, setForm] = useState(() => subject
    ? {
        name_ar: subject.name_ar || subject.name || '',
        name_en: subject.name_en || '',
        code: subject.code || '',
        grade: subject.grade || '',
        is_elective: subject.is_elective || false,
        hours_per_week: subject.hours_per_week ?? 3,
      }
    : { ...defaultForm }
  )
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (open) {
      setForm(subject
        ? {
            name_ar: subject.name_ar || subject.name || '',
            name_en: subject.name_en || '',
            grade: subject.grade || '',
            is_elective: subject.is_elective || false,
            hours_per_week: subject.hours_per_week ?? 3,
          }
        : { ...defaultForm }
      )
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subject])

  const validate = () => {
    const e = {}
    if (!form.name_ar.trim()) e.name_ar = t('common.required')
    if (!form.grade) e.grade = t('common.required')
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSave({
      ...form,
      grade: Number(form.grade),
      hours_per_week: Number(form.hours_per_week) || 3,
      // تعيين name من name_ar للتوافق
      name: form.name_ar,
    })
  }

  if (!open) return null

  const grades = Array.from({ length: 8 }, (_, i) => i + 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold font-cairo text-foreground mb-5">
          {isEdit ? t('subjects.edit_subject') : t('subjects.add_subject')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* الاسم العربي */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('subjects.subject_name')} <span className="text-destructive">*</span>
            </label>
            <input
              className="input-base"
              value={form.name_ar}
              onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))}
              placeholder={t('subjects.subject_name')}
            />
            {errors.name_ar && <p className="text-xs text-destructive mt-1">{errors.name_ar}</p>}
          </div>

          {/* الاسم الإنجليزي */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('subjects.subject_name_en')}
            </label>
            <input
              className="input-base"
              value={form.name_en}
              onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))}
              placeholder="e.g. Mathematics"
              dir="ltr"
            />
          </div>

          {/* الصف وحقول الحصص */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('common.grade')} <span className="text-destructive">*</span>
            </label>
            <select
              className="input-base"
              value={form.grade}
              onChange={(e) => setForm(f => ({ ...f, grade: e.target.value }))}
            >
              <option value="">جميع الصفوف</option>
              {grades.map(g => (
                <option key={g} value={g}>{t('common.grade')} {g}</option>
              ))}
            </select>
            {errors.grade && <p className="text-xs text-destructive mt-1">{errors.grade}</p>}
          </div>

          {/* الساعات الأسبوعية */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('subjects.hours_per_week')}
            </label>
            <input
              type="number"
              className="input-base"
              value={form.hours_per_week}
              min={1}
              max={20}
              onChange={(e) => setForm(f => ({ ...f, hours_per_week: e.target.value }))}
            />
          </div>

          {/* مادة اختيارية */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_elective}
              onChange={(e) => setForm(f => ({ ...f, is_elective: e.target.checked }))}
              className="w-4 h-4 accent-[#d97706] rounded"
            />
            <span className="text-sm font-cairo text-foreground">{t('subjects.is_elective')}</span>
          </label>

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
export default function SubjectsPage() {
  const { t } = useLanguage()

  const { data: subjects = [], isLoading } = useSubjects()
  const { create, update, remove } = useSubjectMutations()

  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterType, setFilterType] = useState('') // '' | 'mandatory' | 'elective'
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // فلترة
  const filtered = useMemo(() => {
    let list = subjects
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.name_ar || s.name || '').toLowerCase().includes(q) ||
        (s.name_en || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q)
      )
    }
    if (filterGrade) {
      list = list.filter(s => String(s.grade) === filterGrade)
    }
    if (filterType === 'mandatory') {
      list = list.filter(s => !s.is_elective)
    } else if (filterType === 'elective') {
      list = list.filter(s => s.is_elective)
    }
    return list
  }, [subjects, search, filterGrade, filterType])

  const handleAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const handleEdit = (subj) => { setEditTarget(subj); setDialogOpen(true) }

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

  const grades = Array.from({ length: 8 }, (_, i) => i + 5)

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
          <h1 className="text-2xl font-bold font-cairo text-foreground">{t('subjects.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subjects.length} {t('subjects.subject_name')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-cairo text-white rounded-md transition-colors"
          style={{ backgroundColor: '#065f46' }}
        >
          <Plus size={16} />
          {t('subjects.add_subject')}
        </button>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            className="input-base ps-9"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-base w-auto"
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
        >
          <option value="">{t('common.grade')} — {t('common.all')}</option>
          {grades.map(g => (
            <option key={g} value={g}>{t('common.grade')} {g}</option>
          ))}
        </select>
        <select
          className="input-base w-auto"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">{t('subjects.subject_type')} — {t('common.all')}</option>
          <option value="mandatory">{t('common.mandatory')}</option>
          <option value="elective">{t('common.elective')}</option>
        </select>
      </div>

      {/* الجدول */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <BookMarked size={48} className="opacity-30" />
          <p className="font-cairo">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white text-xs font-cairo" style={{ backgroundColor: '#065f46' }}>
                <th className="px-4 py-3 text-start font-semibold">{t('subjects.subject_name')}</th>
                <th className="px-4 py-3 text-start font-semibold hidden sm:table-cell">{t('subjects.code')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('common.grade')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('subjects.subject_type')}</th>
                <th className="px-4 py-3 text-start font-semibold hidden md:table-cell">{t('subjects.hours_per_week')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subj, idx) => (
                <tr
                  key={subj.id}
                  className={`border-t border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                >
                  {/* الاسم */}
                  <td className="px-4 py-3">
                    <div className="font-medium font-cairo text-foreground">
                      {subj.name_ar || subj.name}
                    </div>
                    {subj.name_en && (
                      <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{subj.name_en}</div>
                    )}
                  </td>
                  {/* الرمز */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {subj.code ? (
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground" dir="ltr">
                        {subj.code}
                      </span>
                    ) : '—'}
                  </td>
                  {/* الصف */}
                  <td className="px-4 py-3 font-cairo text-foreground">
                    {subj.grade ? `${t('common.grade')} ${subj.grade}` : '—'}
                  </td>
                  {/* النوع */}
                  <td className="px-4 py-3">
                    <SubjectTypeBadge isElective={subj.is_elective} t={t} />
                  </td>
                  {/* الساعات */}
                  <td className="px-4 py-3 hidden md:table-cell text-center text-foreground font-medium">
                    {subj.hours_per_week ?? 3}
                  </td>
                  {/* الإجراءات */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(subj)}
                        title={t('subjects.edit_subject')}
                        className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(subj)}
                        title={t('subjects.delete_subject')}
                        className="p-1.5 rounded-md border border-border text-red-400 hover:text-white hover:bg-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      <SubjectDialog
        open={dialogOpen}
        subject={editTarget}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* حوار الحذف */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('subjects.delete_subject')}
        description={deleteTarget?.name_ar || deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

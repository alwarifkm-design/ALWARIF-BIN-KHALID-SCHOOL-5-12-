import React, { useState, useMemo } from 'react'
import { Printer, Pencil, Trash2, Plus, BookOpen, Users } from 'lucide-react'
import { useSections, useSectionMutations } from '../hooks/useSections.js'
import { useStudents } from '../hooks/useStudents.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx'
import { renderSectionList } from '../utils/printHelpers.js'

// ---- نموذج إضافة / تعديل شعبة ----
function SectionDialog({ open, section, onClose, onSave }) {
  const { t } = useLanguage()
  const isEdit = Boolean(section)

  const [form, setForm] = useState({
    name: section?.name || '',
    grade: section?.grade || '',
    letter: section?.letter || '',
    capacity: section?.capacity ?? 30,
    room_number: section?.room_number || '',
  })

  const gradeLabelMap = {
    5: 'الخامس',
    6: 'السادس',
    7: 'السابع',
    8: 'الثامن',
    9: 'التاسع',
    10: 'العاشر',
    11: 'الحادي عشر',
    12: 'الثاني عشر',
  }
  const [errors, setErrors] = useState({})

  // مزامنة النموذج عند فتح Dialog مختلف
  React.useEffect(() => {
    if (open) {
      setForm({
        name: section?.name || '',
        grade: section?.grade || '',
        letter: section?.letter || '',
        capacity: section?.capacity ?? 30,
        room_number: section?.room_number || '',
      })
      setErrors({})
    }
  }, [open, section])

  const validate = () => {
    const e = {}
    if (!form.grade) e.grade = t('common.required')
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    const sectionNumber = String(form.letter || '1').trim() || '1'
    const autoName = `${gradeLabelMap[Number(form.grade)] || 'الصف'} / ${sectionNumber}`

    onSave({
      ...form,
      name: form.name?.trim() || autoName,
      grade: Number(form.grade),
      letter: sectionNumber,
      capacity: Number(form.capacity) || 30,
    })
  }

  if (!open) return null

  const grades = Array.from({ length: 8 }, (_, i) => i + 5) // 5..12

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold font-cairo text-foreground mb-5">
          {isEdit ? t('sections.edit_section') : t('sections.add_section')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم الصف */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              اسم الصف
            </label>
            <input
              className="input-base"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="حادي عشر / 1"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* الصف */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              {t('common.grade')} <span className="text-destructive">*</span>
            </label>
            <select
              className="input-base"
              value={form.grade}
              onChange={(e) => setForm(f => ({ ...f, grade: e.target.value }))}
            >
              <option value="">{t('common.all')}</option>
              {grades.map(g => (
                <option key={g} value={g}>{t('common.grade')} {g}</option>
              ))}
            </select>
            {errors.grade && <p className="text-xs text-destructive mt-1">{errors.grade}</p>}
          </div>

          {/* رقم الشعبة */}
          <div>
            <label className="block text-sm font-medium font-cairo text-foreground mb-1">
              رقم الشعبة
            </label>
            <input
              className="input-base"
              type="number"
              min={1}
              max={20}
              value={form.letter}
              onChange={(e) => setForm(f => ({ ...f, letter: e.target.value }))}
              placeholder="1"
            />
          </div>

          {/* السعة ورقم الغرفة */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('sections.capacity')}
              </label>
              <input
                type="number"
                className="input-base"
                value={form.capacity}
                min={1}
                max={100}
                onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-cairo text-foreground mb-1">
                {t('sections.room')}
              </label>
              <input
                className="input-base"
                value={form.room_number}
                onChange={(e) => setForm(f => ({ ...f, room_number: e.target.value }))}
                placeholder="101"
              />
            </div>
          </div>

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
export default function SectionsPage() {
  const { t } = useLanguage()

  const { data: sections = [], isLoading: loadingSections } = useSections()
  const { data: students = [] } = useStudents()
  const { create, update, remove } = useSectionMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // عدد الطلاب لكل شعبة (client-side)
  const studentsCountMap = useMemo(() => {
    const map = {}
    for (const s of students) {
      if (s.section_id) {
        map[s.section_id] = (map[s.section_id] || 0) + 1
      }
    }
    return map
  }, [students])

  const handleAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const handleEdit = (sec) => { setEditTarget(sec); setDialogOpen(true) }
  const handleDeleteRequest = (sec) => setDeleteTarget(sec)

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

  const handlePrint = (section) => {
    const sectionStudents = students
      .filter(s => s.section_id === section.id)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
    const html = renderSectionList(section, sectionStudents)
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (loadingSections) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground font-cairo">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">{t('sections.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sections.length} {t('sections.section_name')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-cairo text-white rounded-md transition-colors"
          style={{ backgroundColor: '#065f46' }}
        >
          <Plus size={16} />
          {t('sections.add_section')}
        </button>
      </div>

      {/* شبكة البطاقات */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <BookOpen size={48} className="opacity-30" />
          <p className="font-cairo">{t('common.no_data')}</p>
          <button
            onClick={handleAdd}
            className="text-sm font-cairo underline"
            style={{ color: '#065f46' }}
          >
            {t('sections.add_section')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sections.map((section) => {
            const count = studentsCountMap[section.id] || 0
            const capacity = section.capacity || 30
            const isFull = count >= capacity
            const fillPercent = Math.min(Math.round((count / capacity) * 100), 100)

            return (
              <div
                key={section.id}
                className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold font-cairo text-foreground text-base leading-snug">
                      {section.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {section.grade ? `${gradeLabelMap[Number(section.grade)] || 'الصف'} / ${section.letter || 1}` : ''}
                      {section.letter ? ` / ${section.letter}` : ''}
                    </p>
                  </div>
                  {/* شارة الطلاب/السعة */}
                  <span
                    className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                      isFull
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Users size={11} className="inline mb-0.5 me-0.5" />
                    {count}/{capacity}
                  </span>
                </div>

                {/* شريط الامتلاء */}
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-emerald-500'}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>

                {/* رقم الغرفة */}
                {section.room_number && (
                  <p className="text-xs text-muted-foreground">
                    {t('sections.room')}: <span className="font-medium text-foreground">{section.room_number}</span>
                  </p>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2 mt-auto pt-1 border-t border-border">
                  <button
                    onClick={() => handlePrint(section)}
                    title={t('sections.print_register')}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Printer size={13} />
                    <span className="hidden sm:inline font-cairo">{t('common.print')}</span>
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    title={t('sections.edit_section')}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={13} />
                    <span className="hidden sm:inline font-cairo">{t('common.edit')}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(section)}
                    title={t('sections.delete_section')}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border border-border text-red-500 hover:text-white hover:bg-destructive transition-colors ms-auto"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline font-cairo">{t('common.delete')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      <SectionDialog
        open={dialogOpen}
        section={editTarget}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* حوار الحذف */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('sections.delete_section')}
        description={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Plus, Printer, Check, X, ClipboardList } from 'lucide-react'
import { useSubjectForms, useSubjectFormMutations } from '../hooks/useSubjectForms.js'
import { useStudents } from '../hooks/useStudents.js'
import { useSubjects } from '../hooks/useSubjects.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { renderSubjectForm, renderAllGrade10Forms } from '../utils/printHelpers.js'

// ─── شارة الحالة ─────────────────────────────────────────────────────────────
function SelectionBadge({ status, isAr }) {
  if (status === 'approved')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        {isAr ? 'معتمد' : 'Approved'}
      </span>
    )
  if (status === 'rejected')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        {isAr ? 'مرفوض' : 'Rejected'}
      </span>
    )
  // pending
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
      {isAr ? 'معلق' : 'Pending'}
    </span>
  )
}

// ─── Dialog إضافة اختيار مادة ─────────────────────────────────────────────────
function AddSelectionDialog({ open, onClose, student, electiveSubjects, onSave, isAr }) {
  const [subjectId, setSubjectId] = useState('')
  const [priority, setPriority] = useState(1)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // إعادة الضبط عند فتح النموذج
  React.useEffect(() => {
    if (open) {
      setSubjectId('')
      setPriority(1)
      setErrors({})
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!subjectId) errs.subjectId = isAr ? 'اختر مادة' : 'Subject is required'
    if (!priority || priority < 1 || priority > 5)
      errs.priority = isAr ? 'الأولوية بين 1 و 5' : 'Priority must be 1–5'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const selectedSubject = electiveSubjects.find((s) => s.id === subjectId)

    setSaving(true)
    try {
      await onSave({
        student_id: student.id,
        student_name: student.name,
        subject_id: subjectId,
        subject_name: selectedSubject?.name_ar || selectedSubject?.name || '',
        priority: Number(priority),
        selection_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* رأس النموذج */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold font-cairo text-foreground">
            {isAr ? 'إضافة اختيار مادة' : 'Add Subject Selection'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* بيانات الطالب */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-sm text-muted-foreground font-cairo">
            {isAr ? 'الطالب:' : 'Student:'}{' '}
            <span className="font-semibold text-foreground">{student?.name}</span>
          </p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* المادة الاختيارية */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'المادة الاختيارية' : 'Elective Subject'}
              <span className="text-red-600 ms-1">*</span>
            </label>
            <select
              className={`input-base ${errors.subjectId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : ''}`}
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value)
                if (errors.subjectId) setErrors((p) => ({ ...p, subjectId: '' }))
              }}
            >
              <option value="">{isAr ? '— اختر مادة —' : '— Select subject —'}</option>
              {electiveSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar || s.name}
                  {s.name_en ? ` / ${s.name_en}` : ''}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="mt-1 text-xs text-red-600">{errors.subjectId}</p>
            )}
          </div>

          {/* الأولوية */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isAr ? 'الأولوية' : 'Priority'}
              <span className="text-red-600 ms-1">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={5}
              className={`input-base ${errors.priority ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : ''}`}
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value)
                if (errors.priority) setErrors((p) => ({ ...p, priority: '' }))
              }}
            />
            {errors.priority && (
              <p className="mt-1 text-xs text-red-600">{errors.priority}</p>
            )}
          </div>

          {/* أزرار */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#065f46' }}
            >
              {saving
                ? isAr ? 'جارٍ الحفظ...' : 'Saving...'
                : isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── بطاقة طالب ──────────────────────────────────────────────────────────────
function StudentCard({ student, selections, electiveSubjects, onUpdate, onAdd, onPrint, isAr }) {
  const studentSelections = useMemo(
    () =>
      [...selections.filter((s) => s.student_id === student.id)].sort(
        (a, b) => (a.priority || 0) - (b.priority || 0)
      ),
    [selections, student.id]
  )

  const hasSignature = Boolean(student.guardian_signature_date)

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
      {/* ── رأس البطاقة ── */}
      <div
        className="px-4 py-3 border-b border-border flex items-start justify-between gap-2"
        style={{ backgroundColor: '#f0fdf4' }}
      >
        <div className="min-w-0">
          <p className="font-bold font-cairo text-foreground text-sm truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground font-cairo mt-0.5">
            {isAr ? 'ولي الأمر:' : 'Guardian:'}{' '}
            {student.guardian_name || '—'}
          </p>
        </div>
        {/* علامة التوقيع */}
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            hasSignature
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
          title={
            hasSignature
              ? isAr ? 'تم التوقيع' : 'Signed'
              : isAr ? 'لم يُوقَّع' : 'Not signed'
          }
        >
          {hasSignature ? (
            <>
              <Check size={11} />
              {isAr ? 'موقّع' : 'Signed'}
            </>
          ) : (
            <>
              <X size={11} />
              {isAr ? 'غير موقّع' : 'Unsigned'}
            </>
          )}
        </span>
      </div>

      {/* ── قائمة الاختيارات ── */}
      <div className="flex-1 px-4 py-3 space-y-2 min-h-[80px]">
        {studentSelections.length === 0 ? (
          <p className="text-xs text-muted-foreground font-cairo text-center py-4">
            {isAr ? 'لا توجد اختيارات بعد' : 'No selections yet'}
          </p>
        ) : (
          studentSelections.map((sel) => {
            const subject = electiveSubjects.find((s) => s.id === sel.subject_id)
            const subjectName = subject?.name_ar || sel.subject_name || '—'
            return (
              <div
                key={sel.id}
                className="flex items-center gap-2 text-xs"
              >
                {/* رقم الأولوية */}
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#065f46' }}
                >
                  {sel.priority}
                </span>

                {/* اسم المادة */}
                <span className="flex-1 font-cairo text-foreground truncate" title={subjectName}>
                  {subjectName}
                </span>

                {/* الشارة */}
                <SelectionBadge status={sel.status} isAr={isAr} />

                {/* أزرار الاعتماد/الرفض — فقط للحالة pending */}
                {sel.status === 'pending' && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdate({ id: sel.id, status: 'approved' })}
                      className="p-1 rounded border text-green-600 border-green-300 hover:bg-green-50 transition-colors"
                      title={isAr ? 'اعتماد' : 'Approve'}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ id: sel.id, status: 'rejected' })}
                      className="p-1 rounded border text-red-600 border-red-300 hover:bg-red-50 transition-colors"
                      title={isAr ? 'رفض' : 'Reject'}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── أسفل البطاقة ── */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdd(student)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-foreground hover:bg-muted transition-colors font-cairo"
        >
          <Plus size={13} />
          {isAr ? 'إضافة اختيار' : 'Add Selection'}
        </button>
        <button
          type="button"
          onClick={() => onPrint(student)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors ms-auto"
          title={isAr ? 'طباعة استمارة الطالب' : "Print student's form"}
        >
          <Printer size={13} />
          {isAr ? 'طباعة' : 'Print'}
        </button>
      </div>
    </div>
  )
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function SubjectFormsPage() {
  const { language: lang } = useLanguage()
  const isAr = lang === 'ar'

  // ─── بيانات ─────────────────────────────────────────────────────────────
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents()
  const { data: allSelections = [], isLoading: formsLoading } = useSubjectForms()
  const { data: allSubjects = [], isLoading: subjectsLoading } = useSubjects()
  const { create, update } = useSubjectFormMutations()

  // فلترة: طلاب الصف العاشر فقط
  const grade10Students = useMemo(
    () => allStudents.filter((s) => Number(s.grade) === 10),
    [allStudents]
  )

  // فلترة: المواد الاختيارية للصف العاشر
  const electiveSubjects = useMemo(
    () =>
      allSubjects.filter(
        (s) => s.is_elective === true && Number(s.grade) === 10
      ),
    [allSubjects]
  )

  // ─── Dialog الإضافة ─────────────────────────────────────────────────────
  const [dialogStudent, setDialogStudent] = useState(null) // الطالب المستهدف

  const handleOpenAdd = (student) => setDialogStudent(student)
  const handleCloseAdd = () => setDialogStudent(null)

  const handleSaveSelection = async (data) => {
    await create.mutateAsync(data)
    setDialogStudent(null)
  }

  // ─── اعتماد / رفض ───────────────────────────────────────────────────────
  const handleUpdate = ({ id, status }) => {
    update.mutate({ id, status })
  }

  // ─── طباعة طالب واحد ────────────────────────────────────────────────────
  const handlePrintOne = (student) => {
    const selections = allSelections.filter((s) => s.student_id === student.id)
    const html = renderSubjectForm(student, selections, allSubjects)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }

  // ─── طباعة الكل ──────────────────────────────────────────────────────────
  const handlePrintAll = () => {
    const grade10WithSelections = grade10Students.filter((s) =>
      allSelections.some((sel) => sel.student_id === s.id)
    )
    const html = renderAllGrade10Forms(grade10WithSelections, allSelections, allSubjects)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }

  const loading = studentsLoading || formsLoading || subjectsLoading

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── شريط الأدوات ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* العنوان */}
        <div className="flex items-center gap-2">
          <ClipboardList size={22} color="#065f46" />
          <div>
            <h1 className="text-xl font-bold font-cairo text-foreground leading-tight">
              {isAr ? 'استمارات المواد الاختيارية' : 'Elective Subject Forms'}
            </h1>
            <p className="text-xs text-muted-foreground font-cairo mt-0.5">
              {isAr ? 'لطلاب الصف العاشر فقط' : 'Grade 10 students only'}
            </p>
          </div>
        </div>

        {/* زر طباعة الكل */}
        <button
          type="button"
          onClick={handlePrintAll}
          disabled={grade10Students.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={15} />
          {isAr ? 'طباعة الكل' : 'Print All'}
        </button>
      </div>

      {/* ── حالة التحميل ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground font-cairo">
          {isAr ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      )}

      {/* ── لا توجد بيانات ── */}
      {!loading && grade10Students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ClipboardList size={40} className="opacity-25" />
          <p className="text-sm font-cairo">
            {isAr ? 'لا يوجد طلاب في الصف العاشر' : 'No grade 10 students found'}
          </p>
        </div>
      )}

      {/* ── شبكة البطاقات ── */}
      {!loading && grade10Students.length > 0 && (
        <>
          {/* إحصائية سريعة */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-cairo">
            <span>
              {grade10Students.length}{' '}
              {isAr ? 'طالب في الصف العاشر' : 'grade 10 students'}
            </span>
            <span className="text-border">·</span>
            <span>
              {allSelections.filter((s) =>
                grade10Students.some((st) => st.id === s.student_id)
              ).length}{' '}
              {isAr ? 'اختيار مسجّل' : 'selections registered'}
            </span>
          </div>

          {/* البطاقات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grade10Students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                selections={allSelections}
                electiveSubjects={electiveSubjects}
                onUpdate={handleUpdate}
                onAdd={handleOpenAdd}
                onPrint={handlePrintOne}
                isAr={isAr}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Dialog إضافة اختيار ── */}
      <AddSelectionDialog
        open={Boolean(dialogStudent)}
        onClose={handleCloseAdd}
        student={dialogStudent}
        electiveSubjects={electiveSubjects}
        onSave={handleSaveSelection}
        isAr={isAr}
      />
    </div>
  )
}

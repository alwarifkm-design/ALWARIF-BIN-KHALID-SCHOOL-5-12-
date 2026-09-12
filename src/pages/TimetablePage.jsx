import React, { useState, useMemo } from 'react'
import { Shuffle, Printer, Plus, X, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { useTimetable, useTimetableMutations } from '../hooks/useTimetable.js'
import { useSections } from '../hooks/useSections.js'
import { useSubjects } from '../hooks/useSubjects.js'
import { useTeachers } from '../hooks/useTeachers.js'
import { generateTimetable, DAYS, PERIODS } from '../utils/timetableGenerator.js'
import { renderTimetable } from '../utils/printHelpers.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'

// ---- ثوابت ----
const DAY_LABELS = {
  6: 'السبت',
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
}

// ---- مكوّن Dialog مدمج ----
function SlotDialog({ open, onClose, slot, day, period, subjects, teachers, onSave, onDelete, saving, deleting }) {
  const [subjectId, setSubjectId] = useState(slot?.subject_id || '')
  const [teacherId, setTeacherId] = useState(slot?.teacher_id || '')
  const [room, setRoom] = useState(slot?.room || '')
  const isEdit = !!slot

  // إعادة تعيين الحالة عند تغيير الـ slot
  React.useEffect(() => {
    setSubjectId(slot?.subject_id || '')
    setTeacherId(slot?.teacher_id || '')
    setRoom(slot?.room || '')
  }, [slot, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!subjectId) return
    onSave({ subject_id: subjectId, teacher_id: teacherId || null, room: room || null })
  }

  const dayLabel = DAY_LABELS[day] ?? day
  const periodLabel = `الحصة ${period}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border"
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {isEdit ? 'تعديل الحصة' : 'إضافة حصة'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayLabel} — {periodLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* المادة */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              المادة <span className="text-destructive">*</span>
            </label>
            <select
              className="input-base"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">— اختر المادة —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                  {s.hours_per_week ? ` (${s.hours_per_week} ساعات)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* المعلم */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              المعلم <span className="text-muted-foreground text-xs font-normal">(اختياري)</span>
            </label>
            <select
              className="input-base"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">— بدون معلم —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* رقم الغرفة */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              رقم الغرفة <span className="text-muted-foreground text-xs font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="مثال: 205"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          {/* أزرار */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!subjectId || saving}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: '#065f46' }}
            >
              {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الحصة'}
            </button>

            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="py-2 px-4 rounded-lg text-sm font-bold text-white bg-destructive hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                {deleting ? '...' : 'حذف'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- مكوّن خلية الجدول ----
function TimetableCell({ slot, subjectMap, teacherMap, onAddClick, onEditClick }) {
  if (!slot) {
    return (
      <button
        onClick={onAddClick}
        className="w-full h-full min-h-[72px] rounded-lg border-2 border-dashed border-border hover:border-[#065f46] hover:bg-emerald-50 transition-all flex items-center justify-center group"
        title="إضافة حصة"
      >
        <Plus
          size={20}
          className="text-muted-foreground group-hover:text-[#065f46] transition-colors"
        />
      </button>
    )
  }

  const subject = subjectMap[slot.subject_id]
  const teacher = teacherMap[slot.teacher_id]

  return (
    <button
      onClick={onEditClick}
      className="w-full h-full min-h-[72px] rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all p-2 text-start group relative"
      title="تعديل الحصة"
    >
      <div className="font-bold text-[#065f46] text-xs leading-tight mb-1">
        {subject?.name_ar || '—'}
      </div>
      {teacher && (
        <div className="text-[11px] text-muted-foreground leading-tight">
          {teacher.name}
        </div>
      )}
      {slot.room && (
        <div className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">
          غرفة {slot.room}
        </div>
      )}
      <div className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={11} className="text-[#065f46]" />
      </div>
    </button>
  )
}

// ---- الصفحة الرئيسية ----
export default function TimetablePage() {
  const { t } = useLanguage()

  // State
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [dialogState, setDialogState] = useState(null)
  // dialogState: null | { day, period, slot: null|object }

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // Data hooks
  const { data: sections = [], isLoading: sectionsLoading } = useSections()
  const { data: allSubjects = [] } = useSubjects()
  const { data: teachers = [] } = useTeachers()
  const { data: slots = [], isLoading: slotsLoading } = useTimetable(selectedSectionId)
  const { create, update, remove, bulkCreate, bulkDelete } = useTimetableMutations()

  // الشعبة المختارة
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  )

  // مواد الشعبة (مفلترة بالصف)
  const sectionSubjects = useMemo(() => {
    if (!selectedSection) return allSubjects
    return allSubjects.filter(
      (s) => s.grade == null || String(s.grade) === String(selectedSection.grade)
    )
  }, [allSubjects, selectedSection])

  // Maps للبحث السريع
  const subjectMap = useMemo(
    () => Object.fromEntries(allSubjects.map((s) => [s.id, s])),
    [allSubjects]
  )
  const teacherMap = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t.id, t])),
    [teachers]
  )

  // Grid map: `${day}-${period}` → slot
  const gridMap = useMemo(() => {
    const map = {}
    for (const slot of slots) {
      map[`${slot.day}-${slot.period}`] = slot
    }
    return map
  }, [slots])

  // ---- فتح Dialog ----
  const openAdd = (day, period) => {
    setDialogState({ day, period, slot: null })
  }

  const openEdit = (day, period) => {
    const slot = gridMap[`${day}-${period}`]
    setDialogState({ day, period, slot: slot || null })
  }

  const closeDialog = () => setDialogState(null)

  // ---- حفظ الحصة ----
  const handleSave = async ({ subject_id, teacher_id, room }) => {
    if (!dialogState || !selectedSectionId) return
    const { day, period, slot } = dialogState

    const payload = {
      section_id: selectedSectionId,
      subject_id,
      teacher_id,
      day,
      period,
      room,
    }

    try {
      if (slot) {
        await update.mutateAsync({ id: slot.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      closeDialog()
    } catch (err) {
      console.error('خطأ في حفظ الحصة:', err)
    }
  }

  // ---- حذف الحصة ----
  const handleDelete = async () => {
    if (!dialogState?.slot) return
    try {
      await remove.mutateAsync(dialogState.slot.id)
      closeDialog()
    } catch (err) {
      console.error('خطأ في حذف الحصة:', err)
    }
  }

  // ---- التوليد التلقائي ----
  const handleAutoGenerate = async () => {
    if (!selectedSectionId || !selectedSection) return
    setGenerateError('')

    if (sectionSubjects.length === 0) {
      setGenerateError('لا توجد مواد للصف المحدد. أضف مواد دراسية أولاً.')
      return
    }

    const confirmed = window.confirm(
      `سيتم حذف جميع حصص شعبة "${selectedSection.name}" وإنشاء جدول جديد تلقائياً. هل أنت متأكد؟`
    )
    if (!confirmed) return

    setGenerating(true)
    try {
      // 1. حذف الحصص الحالية
      await bulkDelete.mutateAsync(selectedSectionId)

      // 2. توليد حصص جديدة
      const newSlots = generateTimetable(selectedSectionId, sectionSubjects, teachers)

      if (newSlots.length === 0) {
        setGenerateError('لم يتم توليد أي حصص. تحقق من وجود مواد بعدد ساعات صحيح.')
        setGenerating(false)
        return
      }

      // 3. حفظ الحصص الجديدة
      await bulkCreate.mutateAsync(newSlots)
    } catch (err) {
      console.error('خطأ في التوليد التلقائي:', err)
      setGenerateError('حدث خطأ أثناء التوليد التلقائي. حاول مرة أخرى.')
    } finally {
      setGenerating(false)
    }
  }

  // ---- الطباعة ----
  const handlePrint = () => {
    if (!selectedSection) return
    const html = renderTimetable(selectedSection, slots, allSubjects, teachers)
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

  // ---- حالة الـ Dialog (saving/deleting) ----
  const isSaving = create.isPending || update.isPending
  const isDeleting = remove.isPending

  return (
    <div className="p-4 md:p-6 space-y-5" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── عنوان الصفحة ── */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: '#065f46' }}
        >
          <CalendarDays size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">الجدول الدراسي</h1>
          <p className="text-sm text-muted-foreground">إدارة وتوليد جدول الحصص الأسبوعي</p>
        </div>
      </div>

      {/* ── شريط الأدوات ── */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

          {/* اختيار الشعبة */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              الشعبة
            </label>
            <select
              className="input-base"
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value)
                setGenerateError('')
              }}
              disabled={sectionsLoading}
            >
              <option value="">— اختر الشعبة —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.grade ? ` (الصف ${s.grade})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 sm:mt-5">
            <button
              onClick={handleAutoGenerate}
              disabled={!selectedSectionId || generating || slotsLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: '#d97706' }}
              title="توليد الجدول تلقائياً"
            >
              <Shuffle size={16} />
              {generating ? 'جارٍ التوليد...' : 'توليد تلقائي'}
            </button>

            <button
              onClick={handlePrint}
              disabled={!selectedSectionId || slots.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 border border-border text-foreground hover:bg-muted"
              title="طباعة الجدول"
            >
              <Printer size={16} />
              طباعة
            </button>
          </div>
        </div>

        {/* رسالة الخطأ */}
        {generateError && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {generateError}
          </div>
        )}
      </div>

      {/* ── محتوى الجدول ── */}
      {!selectedSectionId ? (
        /* رسالة عدم الاختيار */
        <div className="bg-card rounded-xl border border-border border-dashed p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <CalendarDays size={32} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">اختر شعبة لعرض الجدول</p>
            <p className="text-sm text-muted-foreground mt-1">
              اختر شعبة من القائمة أعلاه لعرض جدولها الدراسي أو إنشاء جدول جديد
            </p>
          </div>
        </div>
      ) : slotsLoading ? (
        /* حالة التحميل */
        <div className="bg-card rounded-xl border border-border p-16 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">جارٍ تحميل الجدول...</div>
        </div>
      ) : (
        /* الجدول */
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* معلومات الشعبة */}
          {selectedSection && (
            <div
              className="px-5 py-3 border-b border-border flex items-center justify-between"
              style={{ background: '#065f46' }}
            >
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-white/80" />
                <span className="text-white font-bold text-sm">{selectedSection.name}</span>
                {selectedSection.grade && (
                  <span className="text-white/70 text-xs">— الصف {selectedSection.grade}</span>
                )}
              </div>
              <span className="text-white/70 text-xs">
                {slots.length} حصة
              </span>
            </div>
          )}

          {/* الجدول بالـ overflow-x للشاشات الصغيرة */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  {/* رأس العمود الأول */}
                  <th
                    className="px-3 py-3 text-center text-xs font-bold text-white w-20 border-e border-white/20"
                    style={{ background: '#065f46' }}
                  >
                    الحصة
                  </th>
                  {/* أسماء الأيام */}
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-2 py-3 text-center text-xs font-bold text-white border-e border-white/20 last:border-e-0"
                      style={{ background: '#065f46' }}
                    >
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period} className="border-b border-border last:border-b-0">
                    {/* رقم الحصة */}
                    <td className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground bg-muted border-e border-border w-20">
                      الحصة {period}
                    </td>
                    {/* خلايا الأيام */}
                    {DAYS.map((day) => {
                      const slot = gridMap[`${day}-${period}`]
                      return (
                        <td
                          key={day}
                          className="p-1.5 border-e border-border last:border-e-0 align-top"
                          style={{ minWidth: 96 }}
                        >
                          <TimetableCell
                            slot={slot}
                            subjectMap={subjectMap}
                            teacherMap={teacherMap}
                            onAddClick={() => openAdd(day, period)}
                            onEditClick={() => openEdit(day, period)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer — ملخص */}
          <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {slots.length > 0
                ? `إجمالي الحصص: ${slots.length} حصة من أصل 36`
                : 'لا توجد حصص بعد — استخدم "توليد تلقائي" أو أضف حصصاً يدوياً'}
            </span>
            {selectedSection?.room_number && (
              <span>رقم الغرفة: {selectedSection.room_number}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Dialog الحصة ── */}
      {dialogState && (
        <SlotDialog
          open={!!dialogState}
          onClose={closeDialog}
          slot={dialogState.slot}
          day={dialogState.day}
          period={dialogState.period}
          subjects={sectionSubjects}
          teachers={teachers}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={isSaving}
          deleting={isDeleting}
        />
      )}
    </div>
  )
}

import React, { useState, useMemo, useCallback } from 'react'
import {
  UserPlus,
  Shuffle,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react'
import { useStudents, useStudentMutations } from '../hooks/useStudents.js'
import { useSections, useSectionMutations } from '../hooks/useSections.js'
import { autoDistributeByGrade } from '../utils/autoDistributor.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import ConfirmDialog from '../components/shared/ConfirmDialog.jsx'

// ---- ثوابت ----
const GRADES = [5, 6, 7, 8, 9, 10, 11, 12]

const EMPTY_FORM = {
  name: '',
  student_code: '',
  grade: '',
  gender: 'male',
  national_id: '',
  birthdate: '',
  address: '',
  section_id: '',
  section_letter: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  guardian_national_id: '',
  guardian_signature: false,
  guardian_signature_data: '',
  guardian_signature_date: '',
  status: 'active',
  transfer_date: '',
  transfer_to: '',
  notes: '',
}

// ---- مكوّن حقل النموذج ----
function Field({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground font-cairo">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ---- شارة التوقيع ----
function SignatureBadge({ signed }) {
  if (signed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 font-cairo">
        <CheckCircle2 size={12} />
        مكتمل
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 font-cairo">
      <XCircle size={12} />
      معلق
    </span>
  )
}

function SignatureCanvas({ value, onChange }) {
  const canvasRef = React.useRef(null)
  const [isDrawing, setIsDrawing] = React.useState(false)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'

    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }
  }, [value])

  const getPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (event) => {
    event.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const point = getPoint(event)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    setIsDrawing(true)
  }

  const moveDrawing = (event) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const point = getPoint(event)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    onChange(dataUrl)
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="w-full rounded-md border border-border bg-white cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={moveDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex justify-end">
        <button type="button" onClick={clearCanvas} className="text-xs text-red-600 hover:text-red-700 font-cairo">
          مسح التوقيع
        </button>
      </div>
    </div>
  )
}

// ---- Dialog إضافة / تعديل الطالب ----
function StudentDialog({ open, student, sections, onClose, onCreate, onUpdate, isLoading }) {
  const { t } = useLanguage()
  const isEdit = !!student

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (open) {
      setForm(student ? { ...EMPTY_FORM, ...student } : EMPTY_FORM)
      setErrors({})
    }
  }, [open, student])

  const set = useCallback((field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // تسجيل تاريخ التوقيع تلقائياً
      if (field === 'guardian_signature' && value === true && !prev.guardian_signature_date) {
        next.guardian_signature_date = new Date().toISOString().split('T')[0]
      }
      if (field === 'guardian_signature' && value === false) {
        next.guardian_signature_date = ''
      }
      return next
    })
    // مسح خطأ الحقل عند التعديل
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
    }
  }, [errors])

  // التحقق من الحقول الإلزامية الخمسة
  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = 'اسم الطالب مطلوب'
    if (!form.grade) e.grade = 'الصف مطلوب'
    if (!form.guardian_name?.trim()) e.guardian_name = 'اسم ولي الأمر مطلوب'
    if (!form.guardian_phone?.trim()) e.guardian_phone = 'هاتف ولي الأمر مطلوب'
    if (!form.guardian_signature) e.guardian_signature = 'توقيع ولي الأمر مطلوب'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      ...form,
      grade: Number(form.grade),
      guardian_signature: Boolean(form.guardian_signature || form.guardian_signature_data),
      guardian_signature_date: form.guardian_signature_date || new Date().toISOString().split('T')[0],
    }

    if (isEdit) {
      onUpdate({ id: student.id, ...data })
    } else {
      onCreate(data)
    }
  }

  if (!open) return null

  const sectionOptions = sections.filter(s => !form.grade || String(s.grade) === String(form.grade))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-2xl my-4">
        {/* رأس الـ Dialog */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold font-cairo text-foreground">
            {isEdit ? t('students.edit_student') : t('students.add_student')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* نموذج */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* --- قسم بيانات الطالب --- */}
          <p className="text-xs font-bold text-[#065f46] font-cairo uppercase tracking-wide">
            بيانات الطالب
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* رقم الطالب */}
            <Field label="رقم الطالب">
              <input
                type="text"
                value={form.student_code}
                onChange={e => set('student_code', e.target.value)}
                placeholder="مثال: 2025-001"
                className="input-base"
              />
            </Field>

            {/* الاسم */}
            <Field label="اسم الطالب" error={errors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="أدخل اسم الطالب"
                className={`input-base ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
            </Field>

            {/* الصف */}
            <Field label="الصف" error={errors.grade} required>
              <select
                value={form.grade}
                onChange={e => { set('grade', e.target.value); set('section_id', '') }}
                className={`input-base ${errors.grade ? 'border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">اختر الصف</option>
                {GRADES.map(g => (
                  <option key={g} value={g}>الصف {g}</option>
                ))}
              </select>
            </Field>

            {/* الجنس */}
            <Field label="الجنس">
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className="input-base"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </Field>

            {/* الشعبة */}
            <Field label="الشعبة">
              <select
                value={form.section_id}
                onChange={e => set('section_id', e.target.value)}
                className="input-base"
                disabled={!form.grade}
              >
                <option value="">بدون شعبة</option>
                {sectionOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>

            {/* الرقم الوطني */}
            <Field label="الرقم الوطني">
              <input
                type="text"
                value={form.national_id}
                onChange={e => set('national_id', e.target.value)}
                placeholder="الرقم الوطني"
                className="input-base"
              />
            </Field>

            {/* تاريخ الميلاد */}
            <Field label="تاريخ الميلاد">
              <input
                type="date"
                value={form.birthdate}
                onChange={e => set('birthdate', e.target.value)}
                className="input-base"
              />
            </Field>

            {/* العنوان */}
            <Field label="العنوان">
              <input
                type="text"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="العنوان"
                className="input-base"
              />
            </Field>

            {/* الحالة */}
            <Field label="الحالة">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="input-base"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="transferred">باق</option>
                <option value="graduated">ناجح</option>
              </select>
            </Field>

            {(form.status === 'transferred' || form.status === 'graduated') && (
              <Field label={form.status === 'transferred' ? 'تاريخ النقل' : 'تاريخ التخرج'}>
                <input
                  type="date"
                  value={form.transfer_date}
                  onChange={e => set('transfer_date', e.target.value)}
                  className="input-base"
                />
              </Field>
            )}

            {(form.status === 'transferred') && (
              <Field label="نقل إلى">
                <input
                  type="text"
                  value={form.transfer_to}
                  onChange={e => set('transfer_to', e.target.value)}
                  placeholder="اسم المدرسة أو القسم"
                  className="input-base"
                />
              </Field>
            )}
          </div>

          {/* --- قسم بيانات ولي الأمر --- */}
          <p className="text-xs font-bold text-[#065f46] font-cairo uppercase tracking-wide pt-2 border-t border-border">
            بيانات ولي الأمر
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* اسم ولي الأمر */}
            <Field label="اسم ولي الأمر" error={errors.guardian_name} required>
              <input
                type="text"
                value={form.guardian_name}
                onChange={e => set('guardian_name', e.target.value)}
                placeholder="اسم ولي الأمر"
                className={`input-base ${errors.guardian_name ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
            </Field>

            {/* هاتف ولي الأمر */}
            <Field label="هاتف ولي الأمر" error={errors.guardian_phone} required>
              <input
                type="tel"
                value={form.guardian_phone}
                onChange={e => set('guardian_phone', e.target.value)}
                placeholder="+968 XXXXXXXX"
                className={`input-base ${errors.guardian_phone ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
            </Field>

            {/* بريد ولي الأمر */}
            <Field label="بريد ولي الأمر">
              <input
                type="email"
                value={form.guardian_email}
                onChange={e => set('guardian_email', e.target.value)}
                placeholder="email@example.com"
                className="input-base"
              />
            </Field>

            {/* رقم هوية ولي الأمر */}
            <Field label="رقم هوية ولي الأمر">
              <input
                type="text"
                value={form.guardian_national_id}
                onChange={e => set('guardian_national_id', e.target.value)}
                placeholder="رقم الهوية"
                className="input-base"
              />
            </Field>
          </div>

          {/* توقيع ولي الأمر */}
          <div className={`flex flex-col gap-3 p-3 rounded-md border ${errors.guardian_signature ? 'border-red-400 bg-red-50' : 'border-border bg-muted/30'}`}>
            <div className="flex items-start gap-3">
              <input
                id="guardian_signature"
                type="checkbox"
                checked={Boolean(form.guardian_signature || form.guardian_signature_data)}
                onChange={e => {
                  const checked = e.target.checked
                  set('guardian_signature', checked)
                  if (!checked) {
                    set('guardian_signature_data', '')
                    set('guardian_signature_date', '')
                  }
                }}
                className="mt-0.5 w-4 h-4 accent-[#065f46] cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="guardian_signature" className="text-sm font-semibold text-foreground font-cairo cursor-pointer">
                  توقيع ولي الأمر <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  لا يمكن تسجيل الطالب دون توقيع ولي الأمر وإضافة بياناته
                </p>
                {form.guardian_signature && form.guardian_signature_date && (
                  <p className="text-xs text-green-700 mt-1 font-semibold">
                    تاريخ التوقيع: {form.guardian_signature_date}
                  </p>
                )}
                {errors.guardian_signature && (
                  <p className="text-xs text-red-500 mt-1">{errors.guardian_signature}</p>
                )}
              </div>
            </div>

            {(form.guardian_signature || form.guardian_signature_data) && (
              <SignatureCanvas
                value={form.guardian_signature_data || ''}
                onChange={(data) => {
                  set('guardian_signature_data', data)
                  set('guardian_signature', Boolean(data))
                  if (data && !form.guardian_signature_date) {
                    set('guardian_signature_date', new Date().toISOString().split('T')[0])
                  }
                }}
              />
            )}
          </div>

          {/* الملاحظات */}
          <Field label="ملاحظات">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="ملاحظات إضافية..."
              className="input-base resize-none"
            />
          </Field>
        </form>

        {/* أزرار */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors font-cairo"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-md bg-[#065f46] text-white hover:bg-[#065f46]/90 disabled:opacity-60 transition-colors font-cairo font-semibold"
          >
            {isLoading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== الصفحة الرئيسية ==========
export default function StudentsPage() {
  const { t } = useLanguage()
  const { data: students = [], isLoading: studentsLoading } = useStudents()
  const { data: sections = [] } = useSections()
  const { create, update, remove, bulkUpdate } = useStudentMutations()

  // حالة الفلترة
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterSection, setFilterSection] = useState('')

  // حالة الـ Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  // حالة حذف
  const [deleteTarget, setDeleteTarget] = useState(null)

  // حالة التوزيع
  const [distributing, setDistributing] = useState(false)

  // ---- الفلترة الفورية ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(s => {
      // فلتر البحث: يُطابق الاسم أو الصف أو اسم الشعبة
      if (q) {
        const secName = sections.find(sec => sec.id === s.section_id)?.name || ''
        const gradeStr = `الصف ${s.grade}`
        const match =
          (s.name || '').toLowerCase().includes(q) ||
          gradeStr.includes(q) ||
          secName.toLowerCase().includes(q) ||
          String(s.grade).includes(q)
        if (!match) return false
      }
      // فلتر الصف
      if (filterGrade && String(s.grade) !== filterGrade) return false
      // فلتر الشعبة
      if (filterSection && s.section_id !== filterSection) return false
      return true
    })
  }, [students, sections, search, filterGrade, filterSection])

  // الشعب المتاحة للفلتر (حسب الصف إن اختير)
  const sectionFilterOptions = useMemo(() => {
    if (!filterGrade) return sections
    return sections.filter(s => String(s.grade) === filterGrade)
  }, [sections, filterGrade])

  // ---- تغيير الشعبة مباشرة من الجدول ----
  const handleSectionChange = useCallback((student, sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    update.mutate({
      id: student.id,
      section_id: sectionId || null,
      section_letter: section?.letter || null,
    })
  }, [sections, update])

  // ---- التوزيع التلقائي ----
  const handleAutoDistribute = useCallback(async () => {
    const unassigned = students.filter(s => !s.section_id)
    if (!unassigned.length) {
      alert(t('students.no_unassigned'))
      return
    }
    if (!sections.length) {
      alert('لا توجد شعب متاحة للتوزيع')
      return
    }
    setDistributing(true)
    try {
      const updates = autoDistributeByGrade(unassigned, sections)
      if (updates.length) {
        await bulkUpdate.mutateAsync(updates)
        alert(t('students.auto_distribute_success'))
      } else {
        alert('لا توجد شعب لصفوف الطلاب غير الموزعين')
      }
    } catch (err) {
      console.error(err)
      alert('حدث خطأ أثناء التوزيع')
    } finally {
      setDistributing(false)
    }
  }, [students, sections, bulkUpdate, t])

  // ---- حذف ----
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    remove.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }, [deleteTarget, remove])

  const handleTransfer = useCallback((student) => {
    update.mutate({
      id: student.id,
      status: 'transferred',
      transfer_date: new Date().toISOString().split('T')[0],
      transfer_to: student.transfer_to || 'مدرسة أخرى',
    })
  }, [update])

  const handleGraduate = useCallback((student) => {
    update.mutate({
      id: student.id,
      status: 'graduated',
      grade: 12,
      transfer_date: new Date().toISOString().split('T')[0],
      transfer_to: student.transfer_to || 'خريج',
    })
  }, [update])

  const handleYearEndCleanup = useCallback(() => {
    const idsToDelete = students
      .filter((student) => student.status === 'graduated' && Number(student.grade) === 12)
      .map((student) => student.id)

    idsToDelete.forEach((id) => remove.mutate(id))
  }, [students, remove])

  React.useEffect(() => {
    const currentMonth = new Date().getMonth() + 1
    if (currentMonth >= 6) {
      handleYearEndCleanup()
    }
  }, [handleYearEndCleanup])

  // ---- إضافة / تعديل ----
  const handleCreate = useCallback((data) => {
    create.mutate(data, { onSuccess: () => setDialogOpen(false) })
  }, [create])

  const handleUpdate = useCallback((data) => {
    update.mutate(data, { onSuccess: () => { setDialogOpen(false); setEditingStudent(null) } })
  }, [update])

  const openEdit = (student) => {
    setEditingStudent(student)
    setDialogOpen(true)
  }

  const openAdd = () => {
    setEditingStudent(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingStudent(null)
  }

  // شعب الصف المختار (لـ inline select في الجدول)
  const sectionsForRow = useCallback((grade) =>
    sections.filter(s => String(s.grade) === String(grade)),
    [sections]
  )

  const isMutating = create.isPending || update.isPending

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 font-cairo">
      {/* ---- عنوان الصفحة ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground">{t('students.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDistribute}
            disabled={distributing || studentsLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[#d97706] text-[#d97706] hover:bg-amber-50 transition-colors disabled:opacity-60 font-semibold"
          >
            <Shuffle size={15} />
            {distributing ? 'جارٍ التوزيع...' : t('students.auto_distribute')}
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-[#065f46] text-white hover:bg-[#065f46]/90 transition-colors font-semibold"
          >
            <UserPlus size={15} />
            {t('students.add_student')}
          </button>
        </div>
      </div>

      {/* ---- شريط الأدوات / الفلترة ---- */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* بحث */}
        <div className="relative flex-1">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('students.search_placeholder')}
            className="input-base ps-8 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* فلتر الصف */}
        <div className="relative">
          <select
            value={filterGrade}
            onChange={e => { setFilterGrade(e.target.value); setFilterSection('') }}
            className="input-base pe-8 min-w-[120px]"
          >
            <option value="">{t('students.filter_grade')}</option>
            {GRADES.map(g => (
              <option key={g} value={g}>الصف {g}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* فلتر الشعبة */}
        <div className="relative">
          <select
            value={filterSection}
            onChange={e => setFilterSection(e.target.value)}
            className="input-base pe-8 min-w-[130px]"
          >
            <option value="">{t('students.filter_section')}</option>
            {sectionFilterOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ---- عداد النتائج ---- */}
      <p className="text-xs text-muted-foreground -mt-3">
        {filtered.length} طالب {search || filterGrade || filterSection ? '(مفلتر)' : ''}
        {' '}/ {students.length} الإجمالي
      </p>

      {/* ---- الجدول ---- */}
      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#065f46] text-white">
              <th className="px-4 py-3 text-start font-semibold font-cairo whitespace-nowrap">
                {t('students.student_name')}
              </th>
              <th className="px-4 py-3 text-start font-semibold font-cairo whitespace-nowrap">
                {t('common.grade')}
              </th>
              <th className="px-4 py-3 text-start font-semibold font-cairo whitespace-nowrap">
                {t('common.section')}
              </th>
              <th className="px-4 py-3 text-start font-semibold font-cairo whitespace-nowrap">
                {t('students.guardian_name')}
              </th>
              <th className="px-4 py-3 text-start font-semibold font-cairo whitespace-nowrap">
                {t('students.signature_status')}
              </th>
              <th className="px-4 py-3 text-center font-semibold font-cairo whitespace-nowrap">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t('common.loading')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => {
                const rowSections = sectionsForRow(student.grade)
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-border hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    {/* الاسم */}
                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {student.name}
                    </td>

                    {/* الصف */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      الصف {student.grade}
                    </td>

                    {/* الشعبة — قائمة منسدلة مباشرة */}
                    <td className="px-4 py-3">
                      <select
                        value={student.section_id || ''}
                        onChange={e => handleSectionChange(student, e.target.value)}
                        className="text-xs rounded border border-border bg-background text-foreground px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#065f46] cursor-pointer min-w-[100px]"
                        disabled={update.isPending}
                      >
                        <option value="">بدون شعبة</option>
                        {rowSections.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* اسم ولي الأمر */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {student.guardian_name || '—'}
                    </td>

                    {/* التوقيع */}
                    <td className="px-4 py-3">
                      <SignatureBadge signed={!!student.guardian_signature} />
                    </td>

                    {/* الإجراءات */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleTransfer(student)}
                          title="تسجيل باق"
                          className="p-1.5 rounded text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Shuffle size={14} />
                        </button>
                        <button
                          onClick={() => handleGraduate(student)}
                          title="تسجيل نجاح"
                          className="p-1.5 rounded text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(student)}
                          title={t('students.edit_student')}
                          className="p-1.5 rounded text-muted-foreground hover:text-[#065f46] hover:bg-emerald-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(student)}
                          title={t('students.delete_student')}
                          className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Dialog إضافة / تعديل ---- */}
      <StudentDialog
        open={dialogOpen}
        student={editingStudent}
        sections={sections}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isLoading={isMutating}
      />

      {/* ---- حوار تأكيد الحذف ---- */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('students.delete_student')}
        description={deleteTarget ? `هل تريد حذف الطالب "${deleteTarget.name}"؟` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

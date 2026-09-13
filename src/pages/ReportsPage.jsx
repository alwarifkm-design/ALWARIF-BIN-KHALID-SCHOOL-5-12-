import React, { useMemo, useState } from 'react'
import { BarChart3, Printer, FileBarChart2, ShieldAlert } from 'lucide-react'
import { useStudents } from '../hooks/useStudents.js'
import { useSections } from '../hooks/useSections.js'
import { useViolations } from '../hooks/useViolations.js'
import { useAttendance } from '../hooks/useAttendance.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import PrintArea from '../components/shared/PrintArea.jsx'

const GRADES = [5, 6, 7, 8, 9, 10, 11, 12]

function buildReportHtml(summaryRows, totalViolations, totalAbsences, selectedGrade) {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير المدرسة</title>
        <style>
          body { font-family: 'Cairo', sans-serif; direction: rtl; margin: 0; padding: 24px; color: #111827; background: #fff; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: right; font-size: 12px; }
          th { background: #065f46; color: white; }
          .header { border-bottom: 2px solid #065f46; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 700; color: #065f46; margin: 0; }
          .subtitle { margin: 6px 0 0; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير الأداء المدرسي</h1>
          <p class="subtitle">التقرير: ${selectedGrade === 'all' ? 'الكل' : `الصف ${selectedGrade}`} • إجمالي المخالفات: ${totalViolations} • إجمالي الغيابات: ${totalAbsences}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>الصف</th>
              <th>عدد الطلاب</th>
              <th>الحضور</th>
              <th>الغياب</th>
              <th>المتأخرون</th>
              <th>المخالفات</th>
              <th>التوقيعات المعلقة</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows.map((row) => `
              <tr>
                <td>${row.grade}</td>
                <td>${row.totalStudents}</td>
                <td>${row.present}</td>
                <td>${row.absent}</td>
                <td>${row.late}</td>
                <td>${row.violations}</td>
                <td>${row.pendingSignatures}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
}

export default function ReportsPage() {
  const { t } = useLanguage()
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [printHtml, setPrintHtml] = useState('')

  const { data: students = [] } = useStudents()
  const { data: sections = [] } = useSections()
  const { data: violations = [] } = useViolations()
  const { data: attendance = [] } = useAttendance()

  const filteredStudents = useMemo(() => {
    if (selectedGrade === 'all') return students
    return students.filter((student) => String(student.grade) === String(selectedGrade))
  }, [students, selectedGrade])

  const summaryRows = useMemo(() => {
    return GRADES.map((grade) => {
      const gradeStudents = students.filter((student) => Number(student.grade) === grade)
      const gradeAttendance = attendance.filter((record) => Number(record.grade) === grade)
      const gradeViolations = violations.filter((violation) => Number(violation.grade) === grade || (violation.student_name && gradeStudents.some((s) => s.name === violation.student_name)))

      const present = gradeAttendance.filter((record) => record.status === 'present').length
      const absent = gradeAttendance.filter((record) => record.status === 'absent').length
      const late = gradeAttendance.filter((record) => record.status === 'late').length
      const pendingSignatures = gradeStudents.filter((student) => !student.guardian_signature || !student.guardian_signature_date).length

      return {
        grade,
        totalStudents: gradeStudents.length,
        present,
        absent,
        late,
        violations: gradeViolations.length,
        pendingSignatures,
      }
    })
  }, [students, attendance, violations])

  const visibleSummary = useMemo(() => {
    if (selectedGrade === 'all') return summaryRows
    return summaryRows.filter((row) => row.grade === Number(selectedGrade))
  }, [summaryRows, selectedGrade])

  const totalViolations = violations.length
  const totalAbsences = attendance.filter((record) => record.status === 'absent').length
  const avgAttendance = filteredStudents.length ? Math.round((attendance.filter((record) => record.status === 'present' && filteredStudents.some((s) => s.id === record.student_id)).length / filteredStudents.length) * 100) : 0

  const cards = [
    { label: 'إجمالي الطلاب', value: filteredStudents.length, icon: BarChart3, tone: 'emerald' },
    { label: 'إجمالي المخالفات', value: totalViolations, icon: ShieldAlert, tone: 'red' },
    { label: 'معدل الحضور', value: `${avgAttendance}%`, icon: FileBarChart2, tone: 'amber' },
    { label: 'عدد الشعب', value: sections.length, icon: BarChart3, tone: 'sky' },
  ]

  const handlePrint = () => {
    const pdf = buildReportHtml(visibleSummary, totalViolations, totalAbsences, selectedGrade)
    setPrintHtml(pdf)
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-cairo text-foreground">{t('reports.title') || 'التقارير'}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.subtitle') || 'ملخص الأداء والغياب والمخالفات'}</p>
        </div>

        <div className="flex gap-2">
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="input-base min-w-[160px]">
            <option value="all">{t('common.all') || 'الكل'}</option>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-white">
            <Printer className="w-4 h-4" />
            {t('common.print') || 'طباعة'}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`rounded-xl border p-4 shadow-sm ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : tone === 'red' ? 'bg-red-50 text-red-700 border-red-200' : tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80"><Icon className="w-5 h-5" /></span>
            </div>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/80 text-muted-foreground">
                <th className="px-3 py-2 text-right">{t('common.grade') || 'الصف'}</th>
                <th className="px-3 py-2 text-right">{t('home.total_students') || 'إجمالي الطلاب'}</th>
                <th className="px-3 py-2 text-right">{t('attendance.present') || 'حاضر'}</th>
                <th className="px-3 py-2 text-right">{t('attendance.absent') || 'غائب'}</th>
                <th className="px-3 py-2 text-right">{t('attendance.late') || 'متأخر'}</th>
                <th className="px-3 py-2 text-right">{t('violations.title') || 'المخالفات'}</th>
                <th className="px-3 py-2 text-right">توقيعات معلقة</th>
              </tr>
            </thead>
            <tbody>
              {(selectedGrade === 'all' ? summaryRows : visibleSummary).map((row) => (
                <tr key={row.grade} className="border-t border-border">
                  <td className="px-3 py-2">{row.grade}</td>
                  <td className="px-3 py-2">{row.totalStudents}</td>
                  <td className="px-3 py-2">{row.present}</td>
                  <td className="px-3 py-2">{row.absent}</td>
                  <td className="px-3 py-2">{row.late}</td>
                  <td className="px-3 py-2">{row.violations}</td>
                  <td className="px-3 py-2">{row.pendingSignatures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {printHtml && <PrintArea content={printHtml} onAfterPrint={() => setPrintHtml('')} />}
    </div>
  )
}

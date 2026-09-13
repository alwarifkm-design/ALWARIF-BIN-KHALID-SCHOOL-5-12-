import React, { useMemo, useState } from 'react'
import { CalendarCheck2, UserCheck, UserX, Search } from 'lucide-react'
import { useStudents } from '../hooks/useStudents.js'
import { useAttendance, useAttendanceMutations } from '../hooks/useAttendance.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'

const DEFAULT_DATE = new Date().toISOString().slice(0, 10)

function getStatusClasses(status) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700'
  if (status === 'absent') return 'bg-red-100 text-red-700'
  if (status === 'late') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

export default function AttendancePage() {
  const { t, language } = useLanguage()
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE)
  const [gradeFilter, setGradeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { data: students = [] } = useStudents()
  const { data: attendanceRecords = [] } = useAttendance({ date: selectedDate })
  const { create, update } = useAttendanceMutations()

  const attendanceMap = useMemo(() => {
    const map = {}
    attendanceRecords.forEach((record) => {
      map[record.student_id] = record
    })
    return map
  }, [attendanceRecords])

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const gradeMatch = gradeFilter === 'all' || String(student.grade) === String(gradeFilter)
      const searchMatch = !search || student.name?.toLowerCase().includes(search.toLowerCase())
      return gradeMatch && searchMatch
    })
  }, [students, gradeFilter, search])

  const summary = useMemo(() => {
    const total = visibleStudents.length
    const present = visibleStudents.filter((student) => attendanceMap[student.id]?.status === 'present').length
    const absent = visibleStudents.filter((student) => attendanceMap[student.id]?.status === 'absent').length
    const late = visibleStudents.filter((student) => attendanceMap[student.id]?.status === 'late').length
    return { total, present, absent, late }
  }, [visibleStudents, attendanceMap])

  const handleMark = (student, status) => {
    const existing = attendanceMap[student.id]
    const payload = {
      student_id: student.id,
      student_name: student.name,
      grade: Number(student.grade || 0),
      section_id: student.section_id || '',
      section_name: student.section_name || '',
      date: selectedDate,
      status,
      notes: '',
    }

    if (existing) {
      update.mutate({ id: existing.id, ...payload })
      return
    }

    create.mutate(payload)
  }

  const grades = Array.from(new Set(students.map((student) => Number(student.grade)).filter(Boolean))).sort((a, b) => a - b)

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-cairo text-foreground">{t('attendance.title') || 'الحضور والغياب'}</h1>
          <p className="text-sm text-muted-foreground">{t('attendance.subtitle') || 'تسجيل حضور الطلاب يومياً'}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value || DEFAULT_DATE)}
            className="input-base"
          />
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="input-base min-w-[140px]">
            <option value="all">{t('common.all') || 'الكل'}</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label={t('attendance.total_students') || 'إجمالي الطلاب'} value={summary.total} icon={<CalendarCheck2 className="w-5 h-5" />} tone="slate" />
        <SummaryCard label={t('attendance.present') || 'حاضر'} value={summary.present} icon={<UserCheck className="w-5 h-5" />} tone="emerald" />
        <SummaryCard label={t('attendance.absent') || 'غائب'} value={summary.absent} icon={<UserX className="w-5 h-5" />} tone="red" />
        <SummaryCard label={t('attendance.late') || 'متأخر'} value={summary.late} icon={<CalendarCheck2 className="w-5 h-5" />} tone="amber" />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('students.search_placeholder') || 'بحث بالاسم...'}
              className="input-base pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.7fr_1.7fr] bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
            <span>{t('students.student_name') || 'اسم الطالب'}</span>
            <span>{t('common.grade') || 'الصف'}</span>
            <span>{t('students.section_assignment') || 'الشعبة'}</span>
            <span>{t('attendance.status') || 'الحالة'}</span>
          </div>

          <div className="divide-y divide-border bg-background">
            {visibleStudents.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">{t('common.no_data') || 'لا توجد بيانات'}</div>
            ) : (
              visibleStudents.map((student) => {
                const record = attendanceMap[student.id]
                const currentStatus = record?.status || 'pending'

                return (
                  <div key={student.id} className="grid gap-3 px-3 py-3 md:grid-cols-[2fr_1fr_1.7fr_1.7fr] md:items-center">
                    <div>
                      <p className="font-semibold text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.student_code || student.national_id || '—'}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">{student.grade || '—'}</div>

                    <div className="text-sm text-muted-foreground">{student.section_name || student.section_letter || '—'}</div>

                    <div className="flex flex-wrap gap-2">
                      {['present', 'absent', 'late'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleMark(student, status)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                            currentStatus === status
                              ? getStatusClasses(status)
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status === 'present' ? t('attendance.present') || 'حاضر' : status === 'absent' ? t('attendance.absent') || 'غائب' : t('attendance.late') || 'متأخر'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ icon, label, value, tone }) {
  const toneMap = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80">{icon}</span>
      </div>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

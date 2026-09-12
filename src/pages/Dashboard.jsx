import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileSignature,
  ClipboardCheck,
  CalendarRange,
  UserPlus,
  BookOpen,
  Shuffle,
  Printer,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react'
import { useStudents } from '../hooks/useStudents.js'
import { useSections } from '../hooks/useSections.js'
import { useViolations } from '../hooks/useViolations.js'
import { useSupervisors } from '../hooks/useSupervisors.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'

const statClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { data: students = [] } = useStudents()
  const { data: sections = [] } = useSections()
  const { data: violations = [] } = useViolations()
  const { data: supervisors = [] } = useSupervisors()

  const pendingSignatures = students.filter(
    (student) => !student.guardian_signature_date || !student.guardian_signature
  ).length

  const grade10Students = students.filter((student) => Number(student.grade) === 10).length
  const grade10Rate = students.length ? Math.round((grade10Students / students.length) * 100) : 0

  const quickActions = [
    { label: t('home.add_student') || 'إضافة طالب', icon: UserPlus, to: '/students' },
    { label: t('home.manage_sections') || 'إدارة الشعب', icon: BookOpen, to: '/sections' },
    { label: t('home.generate_timetable') || 'مولّد الجدول', icon: Shuffle, to: '/timetable' },
    { label: t('home.print_forms') || 'طباعة الاستمارات', icon: Printer, to: '/subject-forms' },
    { label: t('home.record_violation') || 'تسجيل مخالفة', icon: ShieldAlert, to: '/violations' },
  ]

  const recentViolations = [...violations].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5)

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-cairo text-foreground">{t('home.title') || 'لوحة التحكم'}</h1>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title={t('home.total_students') || 'إجمالي الطلاب'}
          value={students.length}
          tone="emerald"
        />
        <StatCard
          icon={<FileSignature className="w-5 h-5" />}
          title={t('home.pending_signatures') || 'توقيعات معلقة'}
          value={pendingSignatures}
          tone="red"
        />
        <StatCard
          icon={<ClipboardCheck className="w-5 h-5" />}
          title={t('home.grade10_forms_rate') || 'استمارات الصف 10'}
          value={`${grade10Rate}%`}
          tone="amber"
        />
        <StatCard
          icon={<CalendarRange className="w-5 h-5" />}
          title={t('home.timetable_status') || 'حالة الجدول'}
          value={sections.length ? (t('home.timetable_active') || 'نشط') : 'غير متاح'}
          tone="sky"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-cairo text-foreground">{t('home.quick_actions') || 'إجراءات سريعة'}</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-center transition hover:border-primary hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-primary">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-foreground font-cairo">{label}</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold font-cairo text-foreground">{t('home.recent_violations') || 'أحدث المخالفات'}</h2>
          <div className="space-y-3">
            {recentViolations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('home.no_violations') || 'لا توجد مخالفات حديثة'}</p>
            ) : (
              recentViolations.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{violation.student_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{violation.type || '—'} • {violation.date || '—'}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      violation.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : violation.severity === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {violation.severity || 'low'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold font-cairo text-foreground">{t('home.supervisors') || 'المشرفون'}</h2>
          <div className="space-y-3">
            {supervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('home.no_supervisors') || 'لا يوجد مشرفون'}</p>
            ) : (
              supervisors.slice(0, 5).map((supervisor) => (
                <div key={supervisor.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{supervisor.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{supervisor.role || '—'}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{supervisor.phone || '—'}</p>
                    <p>{supervisor.email || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, title, value, tone }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${statClasses[tone]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/70">{icon}</span>
      </div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

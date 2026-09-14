import React, { useMemo, useState } from 'react'
import { Award, Printer, Search } from 'lucide-react'
import { useStudents } from '../hooks/useStudents.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import PrintArea from '../components/shared/PrintArea.jsx'

const CERTIFICATE_TYPES = [
  { value: 'grades', label: 'شهادة الدرجات' },
  { value: 'appreciation', label: 'شهادة شكر وتقدير' },
  { value: 'completion', label: 'شهادة إنجاز' },
  { value: 'honor', label: 'شهادة شرف' },
  { value: 'conduct', label: 'شهادة حسن سلوك' },
]

function buildCertificateHtml(student, type, schoolName, schoolSubtitle) {
  const titleMap = {
    grades: 'شهادة الدرجات',
    appreciation: 'شهادة شكر وتقدير',
    completion: 'شهادة إنجاز',
    honor: 'شهادة شرف',
    conduct: 'شهادة حسن سلوك',
  }

  const date = new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${titleMap[type] || 'شهادة'}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 24px; background: #fff; color: #111827; }
          .sheet { max-width: 900px; margin: 0 auto; border: 2px solid #065f46; border-radius: 18px; padding: 32px 28px; }
          .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 30px; font-weight: 800; color: #065f46; margin: 0; }
          .subtitle { margin-top: 8px; color: #4b5563; font-size: 13px; }
          .body { font-size: 18px; line-height: 2; text-align: center; }
          .name { font-weight: 800; color: #065f46; }
          .signature-box { display: flex; justify-content: space-between; gap: 24px; margin-top: 36px; }
          .sig { width: 45%; text-align: center; border-top: 1px solid #374151; padding-top: 10px; font-size: 13px; color: #374151; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1 class="title">${schoolName}</h1>
            <div class="subtitle">${schoolSubtitle}</div>
            <h2 style="margin: 12px 0 0; font-size: 24px; color: #111827;">${titleMap[type] || 'شهادة'}</h2>
          </div>
          <div class="body">
            <p>نُشْهِدُ بأن الطالب/ة</p>
            <p class="name">${student?.name || '—'}</p>
            <p>من الصف ${student?.grade || '—'}، قد حصل/ت على ${titleMap[type] || 'هذه الشهادة'} بتاريخ ${date}.</p>
            <p>ونرجي له/لها دوام التقدم والنجاح في المستقبل.</p>
          </div>
          <div class="signature-box">
            <div class="sig">مدير المدرسة</div>
            <div class="sig">المشرف</div>
          </div>
        </div>
      </body>
    </html>
  `
}

export default function CertificatesPage() {
  const { t } = useLanguage()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [certificateType, setCertificateType] = useState('completion')
  const [printHtml, setPrintHtml] = useState('')
  const [search, setSearch] = useState('')
  const { data: students = [] } = useStudents()

  const schoolName = 'الوارف بن خالد 5-12'
  const schoolSubtitle = 'نظام إدارة المدرسة'

  const filteredStudents = useMemo(() => {
    return students.filter((student) => student.name?.toLowerCase().includes(search.toLowerCase()))
  }, [students, search])

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || filteredStudents[0] || null

  const handlePrint = () => {
    if (!selectedStudent) return
    const html = buildCertificateHtml(selectedStudent, certificateType, schoolName, schoolSubtitle)
    setPrintHtml(html)
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-cairo text-foreground">{t('certificates.title') || 'الشهادات'}</h1>
        <p className="text-sm text-muted-foreground">{t('certificates.subtitle') || 'إصدار شهادات الطلاب وطباعة النسخ الرسمية'}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-2 block text-sm font-medium text-foreground">بحث الطالب</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-9"
                placeholder="اسم الطالب..."
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-2 block text-sm font-medium text-foreground">نوع الشهادة</label>
            <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)} className="input-base">
              {CERTIFICATE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-2 block text-sm font-medium text-foreground">الطالب</label>
            <select value={selectedStudent?.id || ''} onChange={(e) => setSelectedStudentId(e.target.value)} className="input-base">
              {!selectedStudent && <option value="">اختر طالباً</option>}
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white" disabled={!selectedStudent}>
            <Printer className="w-4 h-4" />
            طباعة الشهادة
          </button>
        </div>
      </section>

      {selectedStudent && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <Award className="w-5 h-5" />
            <h2 className="text-lg font-bold font-cairo text-foreground">معاينة الطالب</h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-foreground">
            <div className="rounded-lg bg-background border border-border p-3"><span className="text-muted-foreground">الاسم:</span> {selectedStudent.name}</div>
            <div className="rounded-lg bg-background border border-border p-3"><span className="text-muted-foreground">الصف:</span> {selectedStudent.grade}</div>
            <div className="rounded-lg bg-background border border-border p-3"><span className="text-muted-foreground">نوع الشهادة:</span> {CERTIFICATE_TYPES.find((item) => item.value === certificateType)?.label}</div>
          </div>
        </section>
      )}

      {printHtml && <PrintArea content={printHtml} onAfterPrint={() => setPrintHtml('')} />}
    </div>
  )
}

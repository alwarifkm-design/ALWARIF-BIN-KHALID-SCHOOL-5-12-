/**
 * printHelpers.js — دوال مساعدة للطباعة الرسمية
 *
 * كل دالة تُنشئ HTML string كاملاً يُعرض داخل PrintArea
 * ثم يُطبع عبر window.print()
 */

// ---- ترويسة مشتركة ----
function buildHeader(titleAr, titleEn = '') {
  return `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:2px solid #065f46;margin-bottom:20px;font-family:'Cairo',sans-serif;direction:rtl">
      <img
        src="/logo.png"
        onerror="this.style.display='none'"
        alt="شعار المدرسة"
        style="width:60px;height:60px;object-fit:contain"
      />
      <div>
        <h1 style="margin:0;font-size:18px;font-weight:700;color:#065f46">الوارف بن خالد 5-12</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Alwarif Bin Khalid School System</p>
        <h2 style="margin:8px 0 0;font-size:15px;font-weight:600;color:#1f2937">${titleAr}</h2>
        ${titleEn ? `<p style="margin:2px 0 0;font-size:11px;color:#6b7280">${titleEn}</p>` : ''}
      </div>
      <div style="margin-right:auto;text-align:left;font-size:11px;color:#6b7280">
        <p style="margin:0">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
        <p style="margin:4px 0 0">Date: ${new Date().toLocaleDateString('en-GB')}</p>
      </div>
    </div>
  `
}

// ---- CSS مشترك ----
const PRINT_CSS = `
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Cairo', 'Alexandria', sans-serif; direction: rtl; margin: 0; padding: 20px; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #065f46; color: white; padding: 8px 10px; text-align: right; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; }
    .badge-green { background:#dcfce7; color:#166534; }
    .badge-red { background:#fee2e2; color:#991b1b; }
    .badge-yellow { background:#fef9c3; color:#854d0e; }
    .signature-line { display:inline-block; width:160px; border-bottom:1px solid #374151; margin-right:8px; }
    @media print {
      body { padding: 10px; }
      .no-print { display: none !important; }
    }
  </style>
`

/**
 * renderSectionList — سجل الشعبة الرسمي
 * @param {Object} section
 * @param {Array}  students
 * @returns {string} HTML
 */
export function renderSectionList(section, students = []) {
  const sectionName = section?.name || '—'
  const rows = students.map((s, index) => `
    <tr>
      <td style="text-align:center">${index + 1}</td>
      <td>${s.name || '—'}</td>
      <td>${s.national_id || '—'}</td>
      <td>${s.birthdate ? new Date(s.birthdate).toLocaleDateString('ar-SA') : '—'}</td>
      <td>${s.gender === 'male' ? 'ذكر' : s.gender === 'female' ? 'أنثى' : '—'}</td>
      <td>${s.guardian_name || '—'}</td>
      <td>${s.guardian_phone || '—'}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>سجل ${sectionName}</title>${PRINT_CSS}</head>
    <body>
      ${buildHeader(`سجل الشعبة — ${sectionName}`, `Class Register — ${sectionName}`)}
      <p style="font-size:12px;color:#4b5563;margin-bottom:12px">
        عدد الطلاب: <strong>${students.length}</strong> | السعة: <strong>${section?.capacity || 30}</strong>
        ${section?.room_number ? ` | رقم الغرفة: <strong>${section.room_number}</strong>` : ''}
      </p>
      <table>
        <thead>
          <tr>
            <th style="width:40px;text-align:center">#</th>
            <th>اسم الطالب</th>
            <th>الرقم الوطني</th>
            <th>تاريخ الميلاد</th>
            <th>الجنس</th>
            <th>اسم ولي الأمر</th>
            <th>رقم الهاتف</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af">لا يوجد طلاب</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `
}

/**
 * renderTimetable — الجدول الدراسي
 * @param {Object} section
 * @param {Array}  slots      TimetableSlot[]
 * @param {Array}  subjects   Subject[]
 * @param {Array}  teachers   Teacher[]
 * @returns {string} HTML
 */
export function renderTimetable(section, slots = [], subjects = [], teachers = []) {
  const DAYS_ORDER = [6, 0, 1, 2, 3, 4]
  const DAY_LABELS = { 6: 'السبت', 0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس' }
  const PERIODS = [1, 2, 3, 4, 5, 6]

  const subjectMap = Object.fromEntries((subjects || []).map(s => [s.id, s]))
  const teacherMap = Object.fromEntries((teachers || []).map(t => [t.id, t]))

  // بناء map: `${day}-${period}` → slot
  const grid = {}
  for (const slot of slots) {
    grid[`${slot.day}-${slot.period}`] = slot
  }

  const headerCells = DAYS_ORDER.map(d => `<th>${DAY_LABELS[d]}</th>`).join('')

  const bodyRows = PERIODS.map(period => {
    const cells = DAYS_ORDER.map(day => {
      const slot = grid[`${day}-${period}`]
      if (!slot) return `<td style="color:#9ca3af;font-size:11px;text-align:center">—</td>`
      const sub = subjectMap[slot.subject_id]
      const tch = teacherMap[slot.teacher_id]
      return `
        <td>
          <div style="font-weight:600;color:#065f46;font-size:12px">${sub?.name_ar || '—'}</div>
          ${tch ? `<div style="font-size:11px;color:#6b7280">${tch.name}</div>` : ''}
          ${slot.room_number ? `<div style="font-size:10px;color:#9ca3af">غرفة ${slot.room_number}</div>` : ''}
        </td>
      `
    }).join('')
    return `<tr><th style="text-align:center;background:#f3f4f6;color:#374151">الحصة ${period}</th>${cells}</tr>`
  }).join('')

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>جدول ${section?.name || ''}</title>${PRINT_CSS}</head>
    <body>
      ${buildHeader(`الجدول الدراسي — ${section?.name || ''}`, `Timetable — ${section?.name || ''}`)}
      <table>
        <thead>
          <tr>
            <th style="width:80px">الحصة</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `
}

/**
 * renderSubjectForm — استمارة المواد الاختيارية (الصف العاشر)
 * @param {Object} student
 * @param {Array}  selections  SubjectForm[]
 * @param {Array}  subjects    Subject[]
 * @returns {string} HTML
 */
export function renderSubjectForm(student, selections = [], subjects = []) {
  const subjectMap = Object.fromEntries((subjects || []).map(s => [s.id, s]))

  const selectionRows = [...selections]
    .sort((a, b) => a.priority - b.priority)
    .map(sel => {
      const sub = subjectMap[sel.subject_id]
      const statusLabel = sel.status === 'approved' ? 'معتمد' : sel.status === 'rejected' ? 'مرفوض' : 'معلق'
      const statusClass = sel.status === 'approved' ? 'badge-green' : sel.status === 'rejected' ? 'badge-red' : 'badge-yellow'
      return `
        <tr>
          <td style="text-align:center">${sel.priority}</td>
          <td>${sub?.name_ar || sel.subject_name || '—'}</td>
          <td>${sub?.name_en || '—'}</td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td>${sel.selection_date ? new Date(sel.selection_date).toLocaleDateString('ar-SA') : '—'}</td>
        </tr>
      `
    }).join('')

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>استمارة ${student?.name || ''}</title>${PRINT_CSS}</head>
    <body>
      ${buildHeader('استمارة اختيار المواد الاختيارية', 'Elective Subjects Selection Form')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;font-size:13px">
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
          <h3 style="margin:0 0 10px;font-size:13px;color:#065f46;font-weight:700">بيانات الطالب</h3>
          <p style="margin:4px 0"><strong>الاسم:</strong> ${student?.name || '—'}</p>
          <p style="margin:4px 0"><strong>الصف:</strong> ${student?.grade ? `الصف ${student.grade}` : '—'}</p>
          <p style="margin:4px 0"><strong>الرقم الوطني:</strong> ${student?.national_id || '—'}</p>
          <p style="margin:4px 0"><strong>تاريخ الميلاد:</strong> ${student?.birthdate ? new Date(student.birthdate).toLocaleDateString('ar-SA') : '—'}</p>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
          <h3 style="margin:0 0 10px;font-size:13px;color:#065f46;font-weight:700">بيانات ولي الأمر</h3>
          <p style="margin:4px 0"><strong>الاسم:</strong> ${student?.guardian_name || '—'}</p>
          <p style="margin:4px 0"><strong>الهاتف:</strong> ${student?.guardian_phone || '—'}</p>
          <p style="margin:4px 0"><strong>رقم الهوية:</strong> ${student?.guardian_national_id || '—'}</p>
        </div>
      </div>

      <h3 style="font-size:13px;color:#065f46;font-weight:700;margin-bottom:8px">اختيارات المواد</h3>
      <table style="margin-bottom:24px">
        <thead>
          <tr>
            <th style="width:60px;text-align:center">الأولوية</th>
            <th>اسم المادة</th>
            <th>Subject Name</th>
            <th style="width:100px">الحالة</th>
            <th style="width:110px">تاريخ الاختيار</th>
          </tr>
        </thead>
        <tbody>
          ${selectionRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">لا توجد اختيارات</td></tr>'}
        </tbody>
      </table>

      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin-bottom:20px;font-size:12px">
        <h3 style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:700">إقرار ولي الأمر</h3>
        <p style="margin:0;line-height:1.7">
          أنا الموقع أدناه ولي أمر الطالب المذكور أعلاه، أقر بموافقتي على اختيارات المواد المذكورة
          وأتعهد بالتزام الطالب بالحضور والمشاركة في هذه المواد.
        </p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:12px;margin-top:30px">
        <div>
          <p style="margin:0 0 30px;font-weight:600">توقيع ولي الأمر:</p>
          <div style="border-bottom:1px solid #374151;height:1px;width:200px"></div>
          <p style="margin:6px 0 0;color:#6b7280">${student?.guardian_name || ''}</p>
        </div>
        <div>
          <p style="margin:0 0 30px;font-weight:600">توقيع المشرف:</p>
          <div style="border-bottom:1px solid #374151;height:1px;width:200px"></div>
          <p style="margin:6px 0 0;color:#6b7280">المشرف المسؤول</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * renderAllGrade10Forms — جميع استمارات الصف العاشر
 * @param {Array} students      Student[] (grade === 10)
 * @param {Array} allSelections SubjectForm[]
 * @param {Array} subjects      Subject[]
 * @returns {string} HTML
 */
export function renderAllGrade10Forms(students = [], allSelections = [], subjects = []) {
  if (!students.length) {
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>استمارات الصف العاشر</title>${PRINT_CSS}</head>
      <body>
        ${buildHeader('استمارات الصف العاشر — المواد الاختيارية')}
        <p style="text-align:center;color:#9ca3af;margin-top:40px">لا يوجد طلاب في الصف العاشر</p>
      </body>
      </html>
    `
  }

  const forms = students.map((student, i) => {
    const selections = allSelections.filter(s => s.student_id === student.id)
    const subjectMap = Object.fromEntries((subjects || []).map(s => [s.id, s]))

    const selectionRows = [...selections]
      .sort((a, b) => a.priority - b.priority)
      .map(sel => {
        const sub = subjectMap[sel.subject_id]
        const statusLabel = sel.status === 'approved' ? 'معتمد' : sel.status === 'rejected' ? 'مرفوض' : 'معلق'
        const statusClass = sel.status === 'approved' ? 'badge-green' : sel.status === 'rejected' ? 'badge-red' : 'badge-yellow'
        return `
          <tr>
            <td style="text-align:center">${sel.priority}</td>
            <td>${sub?.name_ar || sel.subject_name || '—'}</td>
            <td>${sub?.name_en || '—'}</td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          </tr>
        `
      }).join('')

    const pageBreak = i < students.length - 1
      ? 'page-break-after: always; margin-bottom: 0;'
      : ''

    return `
      <div style="${pageBreak}padding:20px">
        ${buildHeader(`استمارة اختيار المواد — ${student.name}`, `Form No. ${i + 1} of ${students.length}`)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;font-size:12px">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px">
            <p style="margin:3px 0"><strong>الاسم:</strong> ${student.name || '—'}</p>
            <p style="margin:3px 0"><strong>الصف:</strong> الصف ${student.grade}</p>
            <p style="margin:3px 0"><strong>الرقم الوطني:</strong> ${student.national_id || '—'}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px">
            <p style="margin:3px 0"><strong>ولي الأمر:</strong> ${student.guardian_name || '—'}</p>
            <p style="margin:3px 0"><strong>الهاتف:</strong> ${student.guardian_phone || '—'}</p>
          </div>
        </div>
        <table style="margin-bottom:16px">
          <thead>
            <tr>
              <th style="width:60px;text-align:center">الأولوية</th>
              <th>المادة</th>
              <th>Subject</th>
              <th style="width:80px">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${selectionRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">لا توجد اختيارات</td></tr>'}
          </tbody>
        </table>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:11px;margin-top:20px">
          <div>
            <p style="margin:0 0 20px;font-weight:600">توقيع ولي الأمر / Guardian Signature:</p>
            <div style="border-bottom:1px solid #374151;width:180px;height:1px"></div>
          </div>
          <div>
            <p style="margin:0 0 20px;font-weight:600">توقيع المشرف / Supervisor Signature:</p>
            <div style="border-bottom:1px solid #374151;width:180px;height:1px"></div>
          </div>
        </div>
      </div>
    `
  })

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>استمارات الصف العاشر</title>
      ${PRINT_CSS}
      <style>
        body { padding: 0; }
        @media print { * { page-break-inside: avoid; } }
      </style>
    </head>
    <body>${forms.join('')}</body>
    </html>
  `
}

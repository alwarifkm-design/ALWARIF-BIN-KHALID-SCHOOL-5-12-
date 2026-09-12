/**
 * autoDistribute — توزيع الطلاب على الشعب توزيعاً دائرياً أبجدياً
 *
 * @param {Array} students  — الطلاب غير الموزَّعين (بدون section_id)
 * @param {Array} sections  — الشعب المتاحة لنفس الصف
 * @returns {Object}        — { [studentId]: sectionId }
 *
 * الخوارزمية:
 *   1. ترتيب الطلاب أبجدياً بـ localeCompare (عربي/إنجليزي)
 *   2. توزيعهم على الشعب بالتناوب: student[i] → sections[i % sections.length]
 *
 * الضمانات (Correctness Properties 7):
 *   أ) كل طالب يُعيَّن لشعبة واحدة بالضبط
 *   ب) الفرق في عدد الطلاب بين أي شعبتين ≤ 1
 */
export function autoDistribute(students, sections) {
  if (!students?.length || !sections?.length) return {}

  // 1. ترتيب أبجدي
  const sorted = [...students].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'ar', { sensitivity: 'base' })
  )

  // 2. توزيع دائري
  const result = {}
  sorted.forEach((student, i) => {
    const section = sections[i % sections.length]
    result[student.id] = section.id
  })

  return result
}

/**
 * autoDistributeByGrade — نسخة تُجمّع الطلاب تلقائياً حسب الصف
 * ثم تُوزّع كل مجموعة على شعب نفس الصف
 *
 * @param {Array} unassignedStudents — الطلاب بدون شعبة
 * @param {Array} allSections        — كل الشعب في النظام
 * @returns {Array}                  — [{ id: studentId, section_id }] للـ bulkUpdate
 */
export function autoDistributeByGrade(unassignedStudents, allSections) {
  if (!unassignedStudents?.length || !allSections?.length) return []

  // تجميع الطلاب حسب الصف
  const byGrade = {}
  for (const student of unassignedStudents) {
    const g = student.grade
    if (!byGrade[g]) byGrade[g] = []
    byGrade[g].push(student)
  }

  const updates = []

  for (const [grade, students] of Object.entries(byGrade)) {
    const gradeSections = allSections.filter(s => String(s.grade) === String(grade))
    if (!gradeSections.length) continue // لا شعب لهذا الصف — تخطّ

    const distribution = autoDistribute(students, gradeSections)
    for (const [studentId, sectionId] of Object.entries(distribution)) {
      updates.push({ id: studentId, section_id: sectionId })
    }
  }

  return updates
}

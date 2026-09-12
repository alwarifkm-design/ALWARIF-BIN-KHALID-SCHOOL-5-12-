/**
 * generateTimetable — توليد الجدول الدراسي تلقائياً
 *
 * الأيام (DAYS): [6, 0, 1, 2, 3, 4] → السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس
 * الحصص (PERIODS): 1 → 6
 *
 * الخوارزمية:
 *   1. بناء قائمة "slots مطلوبة": لكل مادة، كرّر hours_per_week مرة
 *   2. ملء الشبكة 6×6 بالتناوب: slot[i] → day[i % 6], period[floor(i/6) % 6 + 1]
 *      (أو ببساطة: تقدّم خلية خلية من اليسار لليمين، صف بعد صف)
 *   3. تجاهل الخلايا الفائضة (إذا تجاوزت 36 حصة)
 *
 * @param {string} sectionId
 * @param {Array}  subjects   — [{ id, name_ar, hours_per_week, ... }]
 * @param {Array}  teachers   — [{ id, subjects, ... }] (اختياري)
 * @returns {Array}           — TimetableSlot objects جاهزة للحفظ
 */

export const DAYS = [6, 0, 1, 2, 3, 4] // السبت → الخميس
export const PERIODS = [1, 2, 3, 4, 5, 6]
export const MAX_SLOTS = DAYS.length * PERIODS.length // 36

export function generateTimetable(sectionId, subjects, teachers = []) {
  if (!sectionId || !subjects?.length) return []

  // 1. بناء قائمة الطلبات (subject مكرر بعدد ساعاته)
  const requests = []
  for (const subject of subjects) {
    const hours = Math.max(1, subject.hours_per_week || 3)
    for (let h = 0; h < hours; h++) {
      requests.push(subject)
    }
  }

  // 2. تحديد المعلم المناسب لكل مادة (الأول الذي يُدرّسها)
  const teacherForSubject = {}
  for (const subject of subjects) {
    const teacher = teachers.find(t =>
      Array.isArray(t.subjects) && t.subjects.includes(subject.id)
    )
    if (teacher) teacherForSubject[subject.id] = teacher.id
  }

  // 3. ملء الشبكة خلية خلية
  const slots = []
  const maxToFill = Math.min(requests.length, MAX_SLOTS)

  for (let i = 0; i < maxToFill; i++) {
    const dayIndex = i % DAYS.length                // 0..5
    const periodIndex = Math.floor(i / DAYS.length) % PERIODS.length // 0..5
    const subject = requests[i]

    slots.push({
      section_id: sectionId,
      subject_id: subject.id,
      teacher_id: teacherForSubject[subject.id] || null,
      day: DAYS[dayIndex],
      period: PERIODS[periodIndex],
      room: null,
    })
  }

  return slots
}

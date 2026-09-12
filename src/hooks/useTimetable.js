import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TimetableSlot } from '../api/entities.js'

const QK = 'timetable'

export function useTimetable(sectionId) {
  return useQuery({
    queryKey: [QK, sectionId],
    queryFn: () => sectionId ? TimetableSlot.list({ section_id: sectionId }) : [],
    enabled: !!sectionId,
  })
}

export function useTimetableMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => TimetableSlot.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => TimetableSlot.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => TimetableSlot.delete(id),
    onSuccess: invalidate,
  })

  const bulkCreate = useMutation({
    mutationFn: (slots) => TimetableSlot.bulkCreate(slots),
    onSuccess: invalidate,
  })

  const bulkDelete = useMutation({
    mutationFn: async (sectionId) => {
      const slots = await TimetableSlot.list({ section_id: sectionId })
      return Promise.all(slots.map(s => TimetableSlot.delete(s.id)))
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, bulkCreate, bulkDelete }
}

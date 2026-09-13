import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Attendance } from '../api/entities.js'

const QK = 'attendance'

export function useAttendance(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Attendance.list(filters),
  })
}

export function useAttendanceMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Attendance.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Attendance.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Attendance.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

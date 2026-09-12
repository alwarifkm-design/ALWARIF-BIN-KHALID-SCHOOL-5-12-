import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Student } from '../api/entities.js'

const QK = 'students'

export function useStudents(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Student.list(filters),
  })
}

export function useStudentMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Student.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Student.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Student.delete(id),
    onSuccess: invalidate,
  })

  const bulkUpdate = useMutation({
    mutationFn: (updates) => Student.bulkUpdate(updates),
    onSuccess: invalidate,
  })

  return { create, update, remove, bulkUpdate }
}

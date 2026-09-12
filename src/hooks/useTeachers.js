import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Teacher } from '../api/entities.js'

const QK = 'teachers'

export function useTeachers(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Teacher.list(filters),
  })
}

export function useTeacherMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Teacher.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Teacher.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Teacher.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

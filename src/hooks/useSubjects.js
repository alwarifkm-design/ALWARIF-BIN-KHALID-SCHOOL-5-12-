import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Subject } from '../api/entities.js'

const QK = 'subjects'

export function useSubjects(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Subject.list(filters),
  })
}

export function useSubjectMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Subject.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Subject.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Subject.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

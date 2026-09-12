import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SubjectForm } from '../api/entities.js'

const QK = 'subject_forms'

export function useSubjectForms(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => SubjectForm.list(filters),
  })
}

export function useSubjectFormMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => SubjectForm.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => SubjectForm.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => SubjectForm.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

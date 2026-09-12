import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Violation } from '../api/entities.js'

const QK = 'violations'

export function useViolations(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Violation.list(filters),
  })
}

export function useViolationMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Violation.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Violation.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Violation.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

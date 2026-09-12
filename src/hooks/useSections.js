import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Section } from '../api/entities.js'

const QK = 'sections'

export function useSections(filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: () => Section.list(filters),
  })
}

export function useSectionMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Section.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Section.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Section.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

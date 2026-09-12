import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Supervisor } from '../api/entities.js'

const QK = 'supervisors'

export function useSupervisors() {
  return useQuery({
    queryKey: [QK],
    queryFn: () => Supervisor.list(),
  })
}

export function useSupervisorMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] })

  const create = useMutation({
    mutationFn: (data) => Supervisor.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => Supervisor.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => Supervisor.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

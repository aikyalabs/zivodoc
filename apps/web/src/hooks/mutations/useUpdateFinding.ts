import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

export const useUpdateFinding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ findingId, status }: { findingId: string; status: string }) => {
      await apiClient.patch(`/findings/${findingId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      toast.success('Finding updated');
    },
    onError: () => {
      toast.error('Failed to update finding');
    },
  });
};

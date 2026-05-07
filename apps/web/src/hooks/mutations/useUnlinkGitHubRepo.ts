import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

export const useUnlinkGitHubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await apiClient.delete(`/github/link/${projectId}`);
    },
    onSuccess: () => {
      toast.success('Repository unlinked.');
      queryClient.invalidateQueries({ queryKey: ['github'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to unlink repository.');
    },
  });
};

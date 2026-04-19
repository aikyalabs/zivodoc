import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

export const useTriggerScan = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: { mode?: string; branch?: string }) => {
      const response = await apiClient.post<ApiOkResponse<{ id: string }>>(
        `/projects/${projectId}/scans`,
        data ?? {},
      );
      return response.data.payload;
    },
    onSuccess: () => {
      toast.success('Scan started.');
      queryClient.invalidateQueries({ queryKey: ['scans', projectId] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to start scan.');
    },
  });
};

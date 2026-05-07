import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

interface GeneratedKey {
  id: string;
  name: string;
  prefix: string;
  key: string;
  createdAt: string;
}

export const useGenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<ApiOkResponse<GeneratedKey>>('/api-keys', { name });
      return response.data.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to generate API key.');
    },
  });
};

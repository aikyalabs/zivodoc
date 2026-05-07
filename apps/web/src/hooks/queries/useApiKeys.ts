import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export const useApiKeys = () => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<ApiKey[]>>('/api-keys');
      return response.data.payload;
    },
  });
};

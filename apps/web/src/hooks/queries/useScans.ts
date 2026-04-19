import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiPaginatedResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { scanModelSchema } from '@zivodoc/shared';

type Scan = z.output<typeof scanModelSchema>;

export const useScans = (projectId: string, limit = 20, offset = 0) => {
  return useQuery({
    queryKey: ['scans', projectId, limit, offset],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Scan>>(
        `/projects/${projectId}/scans`,
        { params: { limit, offset } },
      );
      return response.data;
    },
    enabled: !!projectId,
  });
};

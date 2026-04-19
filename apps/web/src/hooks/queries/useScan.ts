import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { scanModelSchema } from '@zivodoc/shared';

type Scan = z.output<typeof scanModelSchema>;

export const useScan = (id: string, poll = false) => {
  return useQuery({
    queryKey: ['scans', 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<Scan>>(`/scans/${id}`);
      return response.data.payload;
    },
    enabled: !!id,
    refetchInterval: poll ? 2000 : false,
  });
};

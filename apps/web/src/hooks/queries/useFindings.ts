import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type {
  ApiPaginatedResponse,
  FindingCategory,
  FindingSeverity,
  FindingStatus,
} from '@zivodoc/shared';
import type { z } from 'zod';
import type { findingModelSchema } from '@zivodoc/shared';

type Finding = z.output<typeof findingModelSchema>;

export interface FindingFilters {
  category?: FindingCategory;
  severity?: FindingSeverity;
  status?: FindingStatus;
}

export const useFindings = (
  scanId: string,
  filters: FindingFilters = {},
  limit = 20,
  offset = 0,
) => {
  return useQuery({
    queryKey: ['findings', scanId, filters, limit, offset],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Finding>>(
        `/scans/${scanId}/findings`,
        { params: { ...filters, limit, offset } },
      );
      return response.data;
    },
    enabled: !!scanId,
  });
};

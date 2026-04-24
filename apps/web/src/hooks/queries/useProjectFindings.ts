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

export interface ProjectFindingFilters {
  category?: FindingCategory;
  severity?: FindingSeverity;
  status?: FindingStatus;
}

export const useProjectFindings = (
  projectId: string,
  filters: ProjectFindingFilters = {},
  limit = 25,
  offset = 0,
) => {
  return useQuery({
    queryKey: ['project-findings', projectId, filters, limit, offset],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Finding>>(
        `/projects/${projectId}/findings`,
        { params: { ...filters, limit, offset } },
      );
      return response.data;
    },
    enabled: !!projectId,
  });
};

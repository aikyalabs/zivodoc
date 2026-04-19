import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiPaginatedResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { projectModelSchema } from '@zivodoc/shared';

type Project = z.output<typeof projectModelSchema>;

export const useProjects = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: ['projects', limit, offset],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Project>>('/projects', {
        params: { limit, offset },
      });
      return response.data;
    },
  });
};

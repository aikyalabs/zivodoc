import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { projectModelSchema } from '@zivodoc/shared';

type Project = z.output<typeof projectModelSchema>;

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<Project>>(`/projects/${id}`);
      return response.data.payload;
    },
    enabled: !!id,
  });
};

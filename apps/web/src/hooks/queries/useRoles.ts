import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiPaginatedResponse } from '@template/shared';
import type { z } from 'zod';
import type { roleModelSchema } from '@template/shared';

type Role = z.output<typeof roleModelSchema>;

export const rolesQueryOptions = (options?: { limit?: number; offset?: number }) => {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  return queryOptions({
    queryKey: ['roles', { limit, offset }],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Role>>(
        `/roles?limit=${limit}&offset=${offset}`,
      );
      return response.data;
    },
  });
};

export const useRoles = (options?: { limit?: number; offset?: number }) => {
  return useQuery(rolesQueryOptions(options));
};

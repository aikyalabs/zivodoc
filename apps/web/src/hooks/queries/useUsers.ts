import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiPaginatedResponse } from '@template/shared';
import type { z } from 'zod';
import type { userModelSchema } from '@template/shared';

type User = z.output<typeof userModelSchema>;

export const usersQueryOptions = (options?: { limit?: number; offset?: number }) => {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  return queryOptions({
    queryKey: ['users', { offset, limit }],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<User>>(
        `/users?limit=${limit}&offset=${offset}`,
      );
      return response.data;
    },
  });
};

export const useUsers = (options?: { limit?: number; offset?: number }) => {
  return useQuery(usersQueryOptions(options));
};

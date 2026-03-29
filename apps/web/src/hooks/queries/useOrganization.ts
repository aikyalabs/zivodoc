import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiPaginatedResponse } from '@template/shared';
import type { z } from 'zod';
import type { organizationModelSchema } from '@template/shared';

type Organization = z.output<typeof organizationModelSchema>;

export const organizationQueryOptions = (options?: { limit?: number; offset?: number }) => {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  return queryOptions({
    queryKey: ['organizations', { limit, offset }],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<Organization>>(
        `/organizations?limit=${limit}&offset=${offset}`,
      );
      return response.data;
    },
  });
};

export const useOrganization = (options?: { limit?: number; offset?: number }) => {
  return useQuery(organizationQueryOptions(options));
};

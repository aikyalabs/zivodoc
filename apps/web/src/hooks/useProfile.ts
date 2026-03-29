import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse, UserAuthProfile } from '@template/shared';

export const useProfile = () => {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const response =
        await apiClient.get<ApiOkResponse<{ expiresAt: string; user: UserAuthProfile }>>(
          '/auth/profile',
        );
      return response.data.payload.user;
    },
    retry: false,
  });
};

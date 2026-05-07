import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { githubInstallationSchema } from '@zivodoc/shared';

type GitHubInstallation = z.output<typeof githubInstallationSchema>;

export const useGitHubInstallations = () => {
  return useQuery({
    queryKey: ['github', 'installations'],
    queryFn: async () => {
      const response =
        await apiClient.get<ApiOkResponse<GitHubInstallation[]>>('/github/installations');
      return response.data.payload;
    },
  });
};

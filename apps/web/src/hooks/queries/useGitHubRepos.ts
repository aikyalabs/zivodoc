import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { githubRepoSchema } from '@zivodoc/shared';

type GitHubRepo = z.output<typeof githubRepoSchema>;

export const useGitHubRepos = (installationId: number | null) => {
  return useQuery({
    queryKey: ['github', 'repos', installationId],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<GitHubRepo[]>>(
        `/github/installations/${installationId}/repos`,
      );
      return response.data.payload;
    },
    enabled: installationId !== null,
  });
};

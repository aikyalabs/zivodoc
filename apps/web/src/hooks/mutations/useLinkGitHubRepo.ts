import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

interface LinkRepoInput {
  installationId: number;
  repoId: number;
  repoFullName: string;
  repoDefaultBranch?: string;
  repoPrivate?: boolean;
  repoCloneUrl?: string;
  projectId?: string;
}

interface LinkResult {
  id: string;
  projectId: string;
  repoFullName: string;
}

export const useLinkGitHubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkRepoInput) => {
      const response = await apiClient.post<ApiOkResponse<LinkResult>>('/github/link', data);
      return response.data.payload;
    },
    onSuccess: () => {
      toast.success('Repository linked.');
      queryClient.invalidateQueries({ queryKey: ['github'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to link repository.');
    },
  });
};

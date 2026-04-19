import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { createProjectSchema } from '@zivodoc/shared';

type CreateProjectInput = z.input<typeof createProjectSchema>;

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await apiClient.post<ApiOkResponse<{ id: string }>>('/projects', data);
      return response.data.payload;
    },
    onSuccess: () => {
      toast.success('Project created successfully.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to create project.');
    },
  });
};

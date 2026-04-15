import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';
import type { z } from 'zod';
import type { createOrganizationSchema } from '@zivodoc/shared';

type CreateOrganizationInput = z.input<typeof createOrganizationSchema>;

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationInput) => {
      const response = await apiClient.post<ApiOkResponse<{ id: string }>>('/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization created successfully.');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => {
      toast.error('Failed to create organization.');
    },
  });
};

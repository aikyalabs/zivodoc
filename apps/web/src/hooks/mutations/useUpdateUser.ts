import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { z } from 'zod';
import type { updateUserSchema } from '@zivodoc/shared';

type UpdateUserInput = z.input<typeof updateUserSchema>;

export const useUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      await apiClient.patch(`/users/${userId}`, data);
    },
    onSuccess: () => {
      toast.success('User updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
    onError: () => {
      toast.error('Failed to update user.');
    },
  });
};

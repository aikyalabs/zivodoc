import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@src/lib/queries/defaultQueryFn';

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isDisabled }: { userId: string; isDisabled: boolean }) => {
      await apiClient.patch(`/users/${userId}`, { isDisabled });
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isDisabled ? 'User disabled.' : 'User enabled.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      toast.error('Failed to update user status.');
    },
  });
};

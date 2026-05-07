import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse, UserRole } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/users')({
  component: AdminUsersPage,
});

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  isDisabled: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<AdminUser>>('/admin/users', {
        params: { limit: 50, search: search || undefined },
      });
      return response.data;
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: { id: string; role?: UserRole; isDisabled?: boolean }) => {
      const { id, ...patch } = data;
      await apiClient.patch(`/admin/users/${id}`, patch);
    },
    onSuccess: () => {
      toast.success('User updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to update user.'),
  });

  const users = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          {total} {total === 1 ? 'user' : 'users'} across all organizations.
        </p>
      </div>

      <Input
        placeholder="Search by email or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{`${u.firstName} ${u.lastName}`.trim() || '—'}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) => updateUser.mutate({ id: u.id, role: v as UserRole })}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="owner">owner</SelectItem>
                      <SelectItem value="member">member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.organizationId ? <code>{u.organizationId.slice(0, 16)}…</code> : '—'}
                </TableCell>
                <TableCell>
                  {u.isDisabled ? (
                    <Badge variant="destructive">disabled</Badge>
                  ) : (
                    <Badge variant="muted">active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeTime(u.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateUser.mutate({ id: u.id, isDisabled: !u.isDisabled })}
                  >
                    {u.isDisabled ? 'Enable' : 'Disable'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

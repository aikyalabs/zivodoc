import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/components/atoms/dialog';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
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

interface AdminOrgLite {
  id: string;
  name: string;
  slug: string;
}

interface UserPatch {
  role?: UserRole;
  isDisabled?: boolean;
  organizationId?: string | null;
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<AdminUser>>('/admin/users', {
        params: { limit: 50, search: search || undefined },
      });
      return r.data;
    },
  });

  const { data: orgsResp } = useQuery({
    queryKey: ['admin', 'organizations', 'all-for-select'],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<AdminOrgLite>>('/admin/organizations', {
        params: { limit: 200 },
      });
      return r.data.payload;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UserPatch }) => {
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
  const orgs = orgsResp ?? [];
  const orgNameById = (id: string | null) =>
    id ? (orgs.find((o) => o.id === id)?.name ?? id.slice(0, 16) + '…') : '—';

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
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{`${u.firstName} ${u.lastName}`.trim() || '—'}</TableCell>
                <TableCell>
                  <Badge variant="muted">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {orgNameById(u.organizationId)}
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
                    onClick={() => setEditing(u)}
                    aria-label="Edit user"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editing && (
        <EditUserDialog
          user={editing}
          orgs={orgs}
          onClose={() => setEditing(null)}
          onSave={(patch) =>
            update.mutate({ id: editing.id, patch }, { onSuccess: () => setEditing(null) })
          }
          saving={update.isPending}
        />
      )}
    </div>
  );
}

function EditUserDialog({
  user,
  orgs,
  onClose,
  onSave,
  saving,
}: {
  user: AdminUser;
  orgs: AdminOrgLite[];
  onClose: () => void;
  onSave: (patch: UserPatch) => void;
  saving: boolean;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [organizationId, setOrganizationId] = useState<string | null>(user.organizationId);
  const [isDisabled, setIsDisabled] = useState(user.isDisabled);

  const isAdmin = role === 'admin';
  const orgRequired = !isAdmin;
  const error = orgRequired && !organizationId ? 'Owners and members must belong to an org.' : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;
    const patch: UserPatch = {};
    if (role !== user.role) patch.role = role;
    if (isDisabled !== user.isDisabled) patch.isDisabled = isDisabled;
    const nextOrg = isAdmin ? null : organizationId;
    if (nextOrg !== user.organizationId) patch.organizationId = nextOrg;
    onSave(patch);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.email}</DialogTitle>
          <DialogDescription>
            Update role, org, and status. Admin role has no org.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin (platform)</SelectItem>
                <SelectItem value="owner">owner (org)</SelectItem>
                <SelectItem value="member">member (org)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org">Organization</Label>
            <Select
              value={organizationId ?? '__none__'}
              onValueChange={(v) => setOrganizationId(v === '__none__' ? null : v)}
              disabled={isAdmin}
            >
              <SelectTrigger id="org">
                <SelectValue placeholder="Select an org…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— none —</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name} <span className="text-muted-foreground text-xs">({o.slug})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {isAdmin && (
              <p className="text-xs text-muted-foreground">
                Admins are platform-wide and not bound to an org. Will save as none.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="disabled"
              type="checkbox"
              checked={isDisabled}
              onChange={(e) => setIsDisabled(e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="disabled" className="font-normal">
              Disable login for this user
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || error !== null}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse, PlanType } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/organizations')({
  component: AdminOrgsPage,
});

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  scanQuota: number;
  scansUsedThisMonth: number;
  maxPages: number;
  maxProjects: number;
  createdAt: string;
}

interface OrgPatch {
  plan?: PlanType;
  scanQuota?: number;
  maxProjects?: number;
  maxPages?: number;
}

function AdminOrgsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminOrg | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', search],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<AdminOrg>>('/admin/organizations', {
        params: { limit: 50, search: search || undefined },
      });
      return response.data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/organizations/${id}`);
    },
    onSuccess: () => {
      toast.success('Organization deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
    onError: () => toast.error('Failed to delete organization.'),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: OrgPatch }) => {
      await apiClient.patch(`/admin/organizations/${id}`, patch);
    },
    onSuccess: () => {
      toast.success('Organization updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
    onError: () => toast.error('Failed to update organization.'),
  });

  const orgs = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
        <p className="text-muted-foreground">
          {total} {total === 1 ? 'organization' : 'organizations'} on the platform.
        </p>
      </div>

      <Input
        placeholder="Search by name or slug…"
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Scans (used / quota)</TableHead>
              <TableHead>Max projects</TableHead>
              <TableHead>Max pages</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{o.slug}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{o.plan}</Badge>
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {o.scansUsedThisMonth} / {o.scanQuota}
                </TableCell>
                <TableCell className="tabular-nums">{o.maxProjects}</TableCell>
                <TableCell className="tabular-nums">{o.maxPages}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeTime(o.createdAt)}
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(o)}
                    aria-label="Edit organization"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(o.id)}
                    aria-label="Delete organization"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete organization"
        description="This will cascade-delete all projects, scans, findings, and members. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            remove.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
          }
        }}
      />

      {editing && (
        <EditOrgDialog
          org={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            update.mutate({ id: editing.id, patch }, { onSuccess: () => setEditing(null) });
          }}
          saving={update.isPending}
        />
      )}
    </div>
  );
}

function EditOrgDialog({
  org,
  onClose,
  onSave,
  saving,
}: {
  org: AdminOrg;
  onClose: () => void;
  onSave: (patch: OrgPatch) => void;
  saving: boolean;
}) {
  const [plan, setPlan] = useState<PlanType>(org.plan);
  const [scanQuota, setScanQuota] = useState(org.scanQuota);
  const [maxProjects, setMaxProjects] = useState(org.maxProjects);
  const [maxPages, setMaxPages] = useState(org.maxPages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: OrgPatch = {};
    if (plan !== org.plan) patch.plan = plan;
    if (scanQuota !== org.scanQuota) patch.scanQuota = scanQuota;
    if (maxProjects !== org.maxProjects) patch.maxProjects = maxProjects;
    if (maxPages !== org.maxPages) patch.maxPages = maxPages;
    onSave(patch);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {org.name}</DialogTitle>
          <DialogDescription>Update plan and quotas for this organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as PlanType)}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">free</SelectItem>
                <SelectItem value="pro">pro</SelectItem>
                <SelectItem value="team">team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="scanQuota">Scan quota / month</Label>
              <Input
                id="scanQuota"
                type="number"
                min={0}
                value={scanQuota}
                onChange={(e) => setScanQuota(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxProjects">Max projects</Label>
              <Input
                id="maxProjects"
                type="number"
                min={0}
                value={maxProjects}
                onChange={(e) => setMaxProjects(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxPages">Max pages</Label>
              <Input
                id="maxPages"
                type="number"
                min={0}
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

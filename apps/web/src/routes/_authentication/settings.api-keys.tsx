import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Copy, Check, Plus, Trash2, KeyRound } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/atoms/card';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Badge } from '@src/components/atoms/badge';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@src/components/atoms/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@src/components/atoms/tooltip';
import { formatRelativeTime } from '@src/lib/formatters';
import { useApiKeys } from '@src/hooks/queries/useApiKeys';
import { useGenerateApiKey } from '@src/hooks/mutations/useGenerateApiKey';
import { useRevokeApiKey } from '@src/hooks/mutations/useRevokeApiKey';

export const Route = createFileRoute('/_authentication/settings/api-keys')({
  component: ApiKeysSettingsPage,
});

function ApiKeysSettingsPage() {
  const { data: keys, isLoading } = useApiKeys();
  const generateKey = useGenerateApiKey();
  const revokeKey = useRevokeApiKey();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!keyName.trim()) return;
    generateKey.mutate(keyName.trim(), {
      onSuccess: (data) => {
        setNewKey(data.key);
        setKeyName('');
      },
    });
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setNewKey(null);
    setKeyName('');
  };

  const handleRevoke = () => {
    if (!revokeId) return;
    revokeKey.mutate(revokeId, {
      onSuccess: () => setRevokeId(null),
    });
  };

  const activeKeys = keys?.filter((k) => k.isActive) ?? [];
  const revokedKeys = keys?.filter((k) => !k.isActive) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage API keys for CLI and CI/CD integrations.</p>
        </div>
        <CreateKeyDialog
          isOpen={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseCreate();
            else setIsCreateOpen(true);
          }}
          keyName={keyName}
          onKeyNameChange={setKeyName}
          onGenerate={handleGenerate}
          isPending={generateKey.isPending}
          newKey={newKey}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            Keys used to authenticate CLI and GitHub Action requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activeKeys.length === 0 ? (
            <EmptyState />
          ) : (
            <KeyTable keys={activeKeys} onRevoke={setRevokeId} />
          )}
        </CardContent>
      </Card>

      {revokedKeys.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-sm">Revoked Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyTable keys={revokedKeys} />
          </CardContent>
        </Card>
      )}

      <RevokeDialog
        isOpen={revokeId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        onConfirm={handleRevoke}
        isPending={revokeKey.isPending}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <KeyRound className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No API keys yet</p>
        <p className="text-xs text-muted-foreground">
          Create a key to use the CLI or GitHub Action.
        </p>
      </div>
    </div>
  );
}

interface KeyTableProps {
  keys: Array<{
    id: string;
    name: string;
    prefix: string;
    lastUsedAt: string | null;
    createdAt: string;
    isActive: boolean;
  }>;
  onRevoke?: (id: string) => void;
}

function KeyTable({ keys, onRevoke }: KeyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Used</TableHead>
          {onRevoke && <TableHead className="w-[60px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-medium">{key.name}</TableCell>
            <TableCell>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{key.prefix}...</code>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatRelativeTime(key.createdAt)}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatRelativeTime(key.lastUsedAt)}
            </TableCell>
            {onRevoke && (
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRevoke(key.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revoke key</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface CreateKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onKeyNameChange: (name: string) => void;
  onGenerate: () => void;
  isPending: boolean;
  newKey: string | null;
}

function CreateKeyDialog({
  isOpen,
  onOpenChange,
  keyName,
  onKeyNameChange,
  onGenerate,
  isPending,
  newKey,
}: CreateKeyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        {newKey ? (
          <NewKeyDisplay keyValue={newKey} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>Give your key a name to identify it later.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. GitHub Actions, Local CLI"
                value={keyName}
                onChange={(e) => onKeyNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onGenerate();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onGenerate} disabled={!keyName.trim() || isPending}>
                {isPending ? 'Generating...' : 'Generate Key'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewKeyDisplay({ keyValue, onClose }: { keyValue: string; onClose: () => void }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(keyValue);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Key Created</DialogTitle>
        <DialogDescription>Copy this key now. You won't be able to see it again.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs break-all">
            {keyValue}
          </code>
          <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Badge variant="outline" className="w-fit text-xs text-amber-500 border-amber-500/30">
          This key is shown only once
        </Badge>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  );
}

interface RevokeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function RevokeDialog({ isOpen, onOpenChange, onConfirm, isPending }: RevokeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            This key will immediately stop working. Any CLI or CI/CD pipelines using it will fail.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Revoking...' : 'Revoke Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { AiProvider, ApiOkResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/settings/ai-keys')({
  component: AiKeysSettingsPage,
});

interface AiKeyRow {
  id: string;
  provider: AiProvider;
  model: string;
  keyPreview: string;
  lastUsedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
};

const PROVIDER_HELP: Record<AiProvider, { url: string; placeholder: string }> = {
  anthropic: {
    url: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
  },
  openai: {
    url: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
  },
};

function AiKeysSettingsPage() {
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ['ai-keys'],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<AiKeyRow[]>>('/ai-keys');
      return response.data.payload;
    },
  });

  const [provider, setProvider] = useState<AiProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const upsert = useMutation({
    mutationFn: async (data: { provider: AiProvider; apiKey: string; model?: string }) => {
      await apiClient.put('/ai-keys', data);
    },
    onSuccess: () => {
      toast.success('AI key saved.');
      queryClient.invalidateQueries({ queryKey: ['ai-keys'] });
      setApiKey('');
      setModel('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to save key.');
    },
  });

  const remove = useMutation({
    mutationFn: async (p: AiProvider) => {
      await apiClient.delete(`/ai-keys/${p}`);
    },
    onSuccess: () => {
      toast.success('AI key removed.');
      queryClient.invalidateQueries({ queryKey: ['ai-keys'] });
    },
    onError: () => toast.error('Failed to remove key.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({ provider, apiKey: apiKey.trim(), model: model.trim() || undefined });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Keys</h2>
        <p className="text-muted-foreground">
          Bring your own Anthropic or OpenAI key. Your key is encrypted at rest and only used for
          AI-powered scans, the docs chatbot, and AI readiness scoring on your projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add or update a key</CardTitle>
          <CardDescription>
            We verify the key against the provider before saving. The plaintext key is never logged
            and never returned to the browser after save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as AiProvider)}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="model">
                  Model <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4.1-mini'}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={PROVIDER_HELP[provider].placeholder}
                required
              />
              <p className="text-xs text-muted-foreground">
                Get one at{' '}
                <a
                  href={PROVIDER_HELP[provider].url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {PROVIDER_HELP[provider].url.replace(/^https?:\/\//, '')}
                </a>
                .
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={upsert.isPending || apiKey.length < 10}>
                {upsert.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                {upsert.isPending ? 'Verifying...' : 'Save key'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active keys</CardTitle>
          <CardDescription>One key per provider per organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !keys || keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys configured yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{PROVIDER_LABELS[k.provider]}</span>
                      <span className="text-xs text-muted-foreground">{k.model}</span>
                    </div>
                    <code className="text-xs text-muted-foreground">{k.keyPreview}</code>
                    <span className="text-xs text-muted-foreground">
                      {k.lastUsedAt
                        ? `Last used ${formatRelativeTime(k.lastUsedAt)}`
                        : 'Never used'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove.mutate(k.provider)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

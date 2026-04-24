import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Globe, GitBranch, Loader2, ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Stepper } from '@src/components/molecules/Stepper';
import { useProfile } from '@src/hooks/useProfile';
import { useCreateProject } from '@src/hooks/mutations/useCreateProject';
import { useTriggerScan } from '@src/hooks/mutations/useTriggerScan';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { useQueryClient } from '@tanstack/react-query';

export const Route = createFileRoute('/_authentication/onboarding')({
  component: OnboardingPage,
});

const STEPS = [{ label: 'Workspace' }, { label: 'Add Docs' }, { label: 'First Scan' }];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [scanMode, setScanMode] = useState<'site' | 'repo'>('site');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'pending' | 'running' | 'completed' | 'failed'
  >('idle');

  const createProject = useCreateProject();

  useEffect(() => {
    if (profile && !isLoadingProfile) {
      if (profile.onboardingCompleted) {
        navigate({ to: '/dashboard' });
        return;
      }
      if (!workspaceName) {
        setWorkspaceName(`${profile.firstName}'s workspace`);
      }
    }
  }, [profile, isLoadingProfile]);

  // Poll scan status when we have a project
  useEffect(() => {
    if (!createdProjectId || scanStatus === 'completed' || scanStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/projects/${createdProjectId}/scans`, {
          params: { limit: 1, offset: 0 },
        });
        const latestScan = response.data?.payload?.[0];
        if (latestScan) {
          setScanStatus(latestScan.status);
          if (latestScan.status === 'completed' || latestScan.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createdProjectId, scanStatus]);

  const handleStep1Submit = async () => {
    if (!workspaceName.trim() || !profile?.organizationId) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/organizations/${profile.organizationId}`, {
        name: workspaceName.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      setStep(1);
    } catch {
      // org rename failed — proceed anyway, it's not critical
      setStep(1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2Submit = () => {
    if (!docsUrl.trim()) return;

    const isRepo =
      docsUrl.includes('github.com') ||
      docsUrl.includes('gitlab.com') ||
      docsUrl.includes('bitbucket.org');
    const mode = isRepo ? 'repo' : 'site';
    setScanMode(mode);

    const projectName = extractProjectName(docsUrl);

    createProject.mutate(
      {
        name: projectName,
        siteUrl: mode === 'site' ? docsUrl.trim() : null,
        repoUrl: mode === 'repo' ? docsUrl.trim() : null,
        scanMode: mode,
      },
      {
        onSuccess: (result) => {
          setCreatedProjectId(result.id);
          setStep(2);
          triggerFirstScan(result.id);
        },
      },
    );
  };

  const triggerFirstScan = async (projectId: string) => {
    setScanStatus('pending');
    try {
      await apiClient.post(`/projects/${projectId}/scans`, {});
      setScanStatus('running');
    } catch {
      setScanStatus('failed');
    }
  };

  const handleFinish = async () => {
    try {
      await apiClient.patch('/auth/onboarding');
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    } catch {
      // proceed anyway
    }
    navigate({ to: `/projects/${createdProjectId}` });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 0 && 'Welcome to zivodoc'}
            {step === 1 && 'Add your docs'}
            {step === 2 && 'Your first scan'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 0 && "Let's set up your workspace."}
            {step === 1 && 'Paste a docs site URL or repository link.'}
            {step === 2 && "We're scanning your docs for issues."}
          </p>
        </div>

        <Stepper steps={STEPS} currentStep={step} className="justify-center" />

        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStep1Submit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace name</Label>
              <Input
                id="workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving || !workspaceName.trim()}>
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>
        )}

        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStep2Submit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="docsUrl">Docs URL or repository</Label>
              <Input
                id="docsUrl"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                required
                autoFocus
                placeholder="https://docs.example.com or https://github.com/org/docs"
              />
              <p className="text-xs text-muted-foreground">
                We'll auto-detect if it's a website or a GitHub repo.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createProject.isPending || !docsUrl.trim()}
            >
              {createProject.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {createProject.isPending ? 'Creating...' : 'Start Scanning'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8">
              {scanMode === 'site' ? (
                <Globe className="size-8 text-muted-foreground" />
              ) : (
                <GitBranch className="size-8 text-muted-foreground" />
              )}

              <p className="font-mono text-sm text-muted-foreground break-all">{docsUrl}</p>

              {(scanStatus === 'pending' || scanStatus === 'running' || scanStatus === 'idle') && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {scanStatus === 'pending' ? 'Queued...' : 'Scanning your docs...'}
                  </p>
                </div>
              )}

              {scanStatus === 'completed' && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Scan complete!
                </p>
              )}

              {scanStatus === 'failed' && (
                <p className="text-sm text-destructive font-medium">
                  Scan failed. You can retry from the project page.
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleFinish}
              disabled={scanStatus !== 'completed' && scanStatus !== 'failed'}
            >
              {scanStatus === 'completed'
                ? 'View Results'
                : scanStatus === 'failed'
                  ? 'Go to Project'
                  : 'Waiting for scan...'}
              <ArrowRight className="ml-2 size-4" />
            </Button>

            {(scanStatus === 'pending' || scanStatus === 'running') && (
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip — I'll check later
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function extractProjectName(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (url.includes('github.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts.length >= 2 ? parts[1] : host;
    }
    return host.split('.')[0];
  } catch {
    return 'My Docs';
  }
}

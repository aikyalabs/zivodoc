import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { simpleGit } from 'simple-git';

export interface CloneResult {
  localPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Shallow clone a git repository to a temp directory.
 */
export async function cloneRepo(
  repoUrl: string,
  branch?: string,
  authToken?: string,
): Promise<CloneResult> {
  const tmpDir = path.join(
    os.tmpdir(),
    `zivodoc-repo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await fs.mkdir(tmpDir, { recursive: true });

  const git = simpleGit();

  const cloneOptions = ['--depth', '1'];
  if (branch) {
    cloneOptions.push('--branch', branch);
  }

  let cloneUrl = repoUrl;
  if (authToken) {
    const url = new URL(repoUrl);
    url.username = 'x-access-token';
    url.password = authToken;
    cloneUrl = url.toString();
  }

  await git.clone(cloneUrl, tmpDir, cloneOptions);

  return {
    localPath: tmpDir,
    cleanup: async () => {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {
        // Ignore cleanup errors
      });
    },
  };
}

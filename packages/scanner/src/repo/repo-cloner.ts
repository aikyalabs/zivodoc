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
export async function cloneRepo(repoUrl: string, branch?: string): Promise<CloneResult> {
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

  await git.clone(repoUrl, tmpDir, cloneOptions);

  return {
    localPath: tmpDir,
    cleanup: async () => {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {
        // Ignore cleanup errors
      });
    },
  };
}

import { z } from 'zod';

import { timestamp } from '../timestamp';

export const githubInstallationSchema = z.strictObject({
  id: z.string(),
  installationId: z.number(),
  accountLogin: z.string(),
  accountType: z.string(),
  accountAvatarUrl: z.string().nullable(),
  repositorySelection: z.string(),
  createdAt: timestamp,
});

export const githubRepoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  description: z.string().nullable(),
  htmlUrl: z.string(),
  isLinked: z.boolean(),
});

export const linkRepoRequestSchema = z.strictObject({
  installationId: z.number(),
  repoId: z.number(),
  repoFullName: z.string().min(1),
  repoDefaultBranch: z.string().optional(),
  repoPrivate: z.boolean().optional(),
  repoCloneUrl: z.string().optional(),
  projectId: z.string().optional(),
});

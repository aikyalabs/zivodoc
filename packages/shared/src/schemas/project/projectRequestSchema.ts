import { z } from 'zod';

import { ScanMode } from '../../enums/ScanMode';
import { nonemptystring } from '../nonemptystring';

export const createProjectSchema = z.strictObject({
  name: nonemptystring,
  siteUrl: z.string().url().nullable().optional(),
  repoUrl: z.string().url().nullable().optional(),
  defaultBranch: nonemptystring.default('main'),
  docPaths: z.array(nonemptystring).default(['docs/', 'README.md']),
  scanMode: z.enum(ScanMode).default('site'),
  maxPages: z.number().int().min(1).max(5000).default(500),
  scanSchedule: z.enum(['manual', 'daily', 'weekly']).default('manual'),
  openapiSpecUrl: z.string().url().nullable().optional(),
});

export const updateProjectSchema = z.strictObject({
  name: nonemptystring.optional(),
  siteUrl: z.string().url().nullable().optional(),
  repoUrl: z.string().url().nullable().optional(),
  defaultBranch: nonemptystring.optional(),
  docPaths: z.array(nonemptystring).optional(),
  scanMode: z.enum(ScanMode).optional(),
  maxPages: z.number().int().min(1).max(5000).optional(),
  scanSchedule: z.enum(['manual', 'daily', 'weekly']).optional(),
  openapiSpecUrl: z.string().url().nullable().optional(),
});

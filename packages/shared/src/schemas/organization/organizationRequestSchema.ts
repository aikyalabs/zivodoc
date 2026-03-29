import { z } from 'zod';

import { nonemptystring } from '../nonemptystring';

export const createOrganizationSchema = z.strictObject({
  name: nonemptystring,
  slug: nonemptystring.regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const updateOrganizationSchema = z.strictObject({
  name: nonemptystring.optional(),
  slug: nonemptystring
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

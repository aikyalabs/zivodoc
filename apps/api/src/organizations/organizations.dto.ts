import { createZodDto } from 'nestjs-zod';

import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationResponseSchema,
  organizationsResponseSchema,
} from '@zivodoc/shared';

export class CreateOrganizationRequest extends createZodDto(createOrganizationSchema) {}
export class UpdateOrganizationRequest extends createZodDto(updateOrganizationSchema) {}
export class OrganizationResponse extends createZodDto(organizationResponseSchema) {}
export class OrganizationsResponse extends createZodDto(organizationsResponseSchema) {}

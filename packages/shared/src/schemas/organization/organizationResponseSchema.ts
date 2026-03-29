import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { organizationModelSchema } from './organizationSchema';

export const organizationResponseSchema = buildOkResponse(organizationModelSchema);
export const organizationsResponseSchema = buildPaginatedResponse(organizationModelSchema);

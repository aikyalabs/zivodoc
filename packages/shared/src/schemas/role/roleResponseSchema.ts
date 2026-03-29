import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { roleModelSchema } from './roleSchema';

export const roleResponseSchema = buildOkResponse(roleModelSchema);
export const rolesResponseSchema = buildPaginatedResponse(roleModelSchema);

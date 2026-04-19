import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { findingModelSchema } from './findingSchema';

export const findingResponseSchema = buildOkResponse(findingModelSchema);
export const findingsResponseSchema = buildPaginatedResponse(findingModelSchema);

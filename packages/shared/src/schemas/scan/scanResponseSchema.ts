import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { scanModelSchema } from './scanSchema';

export const scanResponseSchema = buildOkResponse(scanModelSchema);
export const scansResponseSchema = buildPaginatedResponse(scanModelSchema);

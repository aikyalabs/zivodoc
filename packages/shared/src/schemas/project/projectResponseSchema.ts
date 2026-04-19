import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { projectModelSchema } from './projectSchema';

export const projectResponseSchema = buildOkResponse(projectModelSchema);
export const projectsResponseSchema = buildPaginatedResponse(projectModelSchema);

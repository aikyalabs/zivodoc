import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { userModelSchema } from './userSchema';

export const userResponseSchema = buildOkResponse(userModelSchema);
export const usersResponseSchema = buildPaginatedResponse(userModelSchema);

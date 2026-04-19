import { createZodDto } from 'nestjs-zod';

import {
  createProjectSchema,
  updateProjectSchema,
  projectResponseSchema,
  projectsResponseSchema,
} from '@zivodoc/shared';

export class CreateProjectRequest extends createZodDto(createProjectSchema) {}
export class UpdateProjectRequest extends createZodDto(updateProjectSchema) {}
export class ProjectResponse extends createZodDto(projectResponseSchema) {}
export class ProjectsResponse extends createZodDto(projectsResponseSchema) {}

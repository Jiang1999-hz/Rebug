import type { Project } from '@prisma/client';

export type AppVariables = {
  developerEmail: string;
  developerId: string;
  project: Project;
};

export type AppEnv = {
  Variables: AppVariables;
};

import { ENVIRONMENT } from 'constants/environment';

/** The available application environment types. */
export type Environment = typeof ENVIRONMENT[keyof typeof ENVIRONMENT];

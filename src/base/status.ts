import { value } from 'vue-function-api';

export type Status = string | { text: string, value: string } | null;

export const status = value<Status>(null);

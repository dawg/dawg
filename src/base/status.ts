import { ref } from '@vue/composition-api';

export type Status = string | { text: string, value: string } | null;

export const status = ref<Status>(null);

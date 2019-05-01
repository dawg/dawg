import { emitter } from '@/dawg/events';
export const events = emitter<{ add: (notification: Notification) => void }>();

export interface NotificationConfig {
  detail?: string;
  duration?: number;
  dismissible?: boolean;
}

export interface Notification {
  message: string;
  params: NotificationConfig;
  type: string;
  icon: string;
}

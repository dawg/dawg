import { emitter } from '@/lib/events';

export const events = emitter<{ add: [Notification] }>();

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationConfig {
  detail?: string;
  duration?: number;
  dismissible?: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  callback: () => void;
}

export interface Notification {
  message: string;
  params: NotificationConfig;
  type: NotificationType;
}

const notifications: Notification[] = [];

const notify = (type: NotificationType) => (message: string, params?: NotificationConfig) => {
  const notification = { message, params: params || {}, type };
  notifications.push(notification);
  events.emit('add', notification);
};

export const info = notify('info');
export const success = notify('success');
export const warning = notify('warning');
export const error = notify('error');

export const subscribe = (listener: (notification: Notification) => void) => {
  notifications.forEach((notification) => {
    listener(notification);
  });

  events.addListener('add', listener);
  return {
    dispose() {
      events.removeListener('add', listener);
    },
  };
};

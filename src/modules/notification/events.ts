import Vue from 'vue';
export const events = new Vue();

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

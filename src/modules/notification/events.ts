import Vue from 'vue';
export const events = new Vue();

export interface NotificationConfig {
  detail?: string;
  dismissible?: boolean;
}

export interface Notification {
  message: string;
  params: NotificationConfig;
  type: string;
  icon: string;
}

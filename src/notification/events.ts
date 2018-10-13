import Vue from 'vue';
export const events = new Vue();

export interface Params {
    detail?: string;
    dismissible?: boolean;
}

export interface Notification {
message: string;
params: Params;
type: string;
}

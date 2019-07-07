// 1. Make sure to import 'vue' before declaring augmented types
import Vue from 'vue'
import { UpdateAugmentation } from '@/modules/update';
import { KnobAugmentation } from '@/modules/knobs';
import { Automatable } from '@/core';
import { StatusAugmentation } from '@/modules/status';

// 2. Specify a file with the types you want to augment
//    Vue has the constructor type in types/vue.d.ts
declare module 'vue/types/vue' {
  // 3. Declare augmentation for Vue
  // I'm not sure that this is the best way to do things...
  interface Vue extends 
    UpdateAugmentation,
    KnobAugmentation<Automatable>, 
    StatusAugmentation
  {
    $log: {
      debug(...args: any[]): void,
      info(...args: any[]): void,
      warn(...args: any[]): void,
      error(...args: any[]): void,
      fatal(...args: any[]): void,
    }
  }
}
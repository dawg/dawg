// 1. Make sure to import 'vue' before declaring augmented types
import Vue from 'vue'
import { UpdateAugmentation } from '@/modules/update';
import { NotifyInterface } from '@/modules/notification';
import { ContextInterface } from '@/modules/context';
import { KnobAugmentation } from '@/modules/knobs';
import { Automatable } from '@/schemas';
import { PaletteAugmentation } from '@/modules/palette';

// 2. Specify a file with the types you want to augment
//    Vue has the constructor type in types/vue.d.ts
declare module 'vue/types/vue' {
  // 3. Declare augmentation for Vue
  interface Vue extends UpdateAugmentation, NotifyInterface, ContextInterface, KnobAugmentation<Automatable>, PaletteAugmentation {
    $log: {
      debug(...args: any[]): void,
      info(...args: any[]): void,
      warn(...args: any[]): void,
      error(...args: any[]): void,
      fatal(...args: any[]): void,
    }
  }
}
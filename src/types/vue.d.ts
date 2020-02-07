// 1. Make sure to import 'vue' before declaring augmented types
import Vue from 'vue'
import { UpdateAugmentation } from '@/lib/update';

// 2. Specify a file with the types you want to augment
//    Vue has the constructor type in types/vue.d.ts
declare module 'vue/types/vue' {
  // 3. Declare augmentation for Vue
  // I'm not sure that this is the best way to do things...
  interface Vue extends  UpdateAugmentation {
  }
}
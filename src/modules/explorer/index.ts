import Tree from '@/modules/explorer/Tree.vue';
import FileExplorer from '@/modules/explorer/FileExplorer.vue';

export default {
  install(vue: any) {
    vue.component('Tree', Tree);
    vue.component('FileExplorer', FileExplorer);
  },
};

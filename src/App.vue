<template>
  <v-app dark id="#app">
    <drawer></drawer>
    <toolbar></toolbar>
    <v-content>
      <v-container fluid fill-height>
        <router-view></router-view>
      </v-container>
    </v-content>
    <foot></foot>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Toolbar from '@/components/Toolbar.vue';
import Drawer from '@/components/Drawer.vue';
import Foot from '@/components/Foot.vue';

const tree = {
  label: 'root',
};

@Component({
  components: { Drawer, Toolbar, Foot },
})
export default class App extends Vue {
  public children = tree;
}
</script>

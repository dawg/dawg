<template>
  <v-app dark id="#app">
    <drawer></drawer>
    <toolbar></toolbar>
    <v-content>
      <v-container fluid fill-height>
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Toolbar from '@/components/Toolbar.vue';
import Drawer from '@/components/Drawer.vue';

const tree = {
  label: 'root',
};

@Component({
  components: { Drawer, Toolbar },
})
export default class App extends Vue {
  public children = tree;
}
</script>

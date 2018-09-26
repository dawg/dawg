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

<script>
import Toolbar from '@/components/Toolbar.vue';
import Drawer from '@/components/Drawer.vue';

const tree = {
  label: 'root',
};

export default {
  name: 'App',
  components: { Drawer, Toolbar },
  data: () => ({
    children: tree,
  }),
};
</script>

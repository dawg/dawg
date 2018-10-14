<template>
  <v-app>
    <activity-bar :activity-bar-width="60" :side-panel-width="300">
      <side-bar
        v-for="item in items"
        :key="item.title"
        :name="item.title"
        :icon="item.icon"
      ></side-bar>
    </activity-bar>

    <toolbar :style="`padding-left: ${360}px`"></toolbar>
    
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
import SideBar from '@/components/SideBar.vue';
import ActivityBar from '@/components/ActivityBar.vue';

const tree = {
  label: 'root',
};

@Component({
  components: { ActivityBar, SideBar, Toolbar },
})
export default class App extends Vue {
  public children = tree;
  public items = [
    { title: 'EXPLORER', icon: 'folder' },
    { title: 'SYNTHESIZERS', icon: 'playlist_add' },
    { title: 'SYNTHESIZER', icon: 'queue_music' },
    { title: 'SEARCH', icon: 'search' },
  ];
}
</script>

<style lang="sass">
@import '~@/styles/global'
</style>

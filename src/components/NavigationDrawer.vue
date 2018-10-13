<template>
  <div>
    <v-navigation-drawer 
      fixed 
      clipped 
      permanent 
      app
      mini-variant
      class="secondary-lighten-2"
    >
      <v-list dense style="height: 100%; display: flex; flex-direction: column">

        <v-list-tile
          v-for="item in items"
          :key="item.title"
          @click="click"
        >
          <v-list-tile-action>
            <v-icon medium color="white">{{ item.icon }}</v-icon>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <div style="flex-grow: 1"></div>

        <v-list-tile @click="click">
          <v-list-tile-action>
            <v-icon medium color="white">settings</v-icon>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title> DSFLKJ</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        

      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer 
      fixed 
      clipped 
      permanent 
      app
      class="secondary"
      style="left: 80px"
    >
      <v-list class="pt-0" dense>
        <v-divider></v-divider>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="white--text" style="margin: 10px">EXPLORER</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class NavigationDrawer extends Vue {
  public drawer = true;
  public items = [
    { title: 'EXPLORER', icon: 'folder' },
    { title: 'SYNTHESIZERS', icon: 'playlist_add' },
    { title: 'SYNTHESIZER', icon: 'queue_music' },
  ];
  public mini = true;
  public right = null;
  public click() {
    //
  }
}
</script>

<style scoped lang="sass">
</style>
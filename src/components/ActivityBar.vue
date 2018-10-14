<template>
  <div>
    
    <v-navigation-drawer 
      fixed 
      clipped 
      permanent 
      app
      mini-variant
      class="secondary-lighten-2"
      :mini-variant-width="width"
    >
      <v-list dense style="height: 100%; display: flex; flex-direction: column">
        <v-list-tile
          v-for="item in items"
          :key="item.title"
          @click="click"
        >
          <v-icon medium color="white">{{ item.icon }}</v-icon>
        </v-list-tile>

        <div style="flex-grow: 1"></div>

        <v-list-tile @click="click">
          <v-icon medium color="white">settings</v-icon>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <div>
      <h2>{{ title }}</h2>

      <v-navigation-drawer 
        fixed 
        clipped 
        permanent 
        app
        class="secondary"
        :style="`left: ${width}px`"
      >
        <v-list class="pt-0" dense>
          
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title class="white--text" style="margin: 10px">{{ title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <slot></slot>
       
        </v-list>
      </v-navigation-drawer>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { TabParent } from '@/mixins/tabParent';

@Component
export default class ActivityBar extends Mixins(TabParent) {
  public drawer = true;
  public items = [
    { title: 'EXPLORER', icon: 'folder' },
    { title: 'SYNTHESIZERS', icon: 'playlist_add' },
    { title: 'SYNTHESIZER', icon: 'queue_music' },
    { title: 'SEARCH', icon: 'search' },
  ];
  public mini = true;
  public right = null;
  public width = 60;
  public click() {
    //
  }
}
</script>

<style scoped lang="sass">
</style>
<template>
  <div>
    
    <v-navigation-drawer 
      fixed 
      permanent 
      mini-variant
      class="secondary-lighten-2"
      :mini-variant-width="activityBarWidth"
    >
      <v-list dense style="height: 100%; display: flex; flex-direction: column">
        <v-list-tile
          v-for="item in items"
          :key="item.name"
          @click="click(item, $event)"
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
      <v-navigation-drawer 
        fixed 
        permanent 
        class="secondary"
        :style="`left: ${activityBarWidth}px`"
        :width="sidePanelWidth"
      >
        <v-list class="pt-0" dense>
          
          <v-list-tile>
            <v-list-tile-content>
            </v-list-tile-content>
              <v-list-tile-title class="white--text title" style="margin: 10px">{{ title }}</v-list-tile-title>
          </v-list-tile>

          <base-tabs ref="tabs" @changed="changed">
            <slot></slot>
          </base-tabs>
       
        </v-list>
      </v-navigation-drawer>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';

@Component({ components: {SideBar, BaseTabs} })
export default class ActivityBar extends Vue {
  @Prop({ type: Number, default: 60 }) public activityBarWidth!: number;
  @Prop({ type: Number, default: 60 }) public sidePanelWidth!: number;

  public drawer = true;
  public mini = true;
  public right = null;
  public title = '';
  public tabs?: BaseTabs;
  public items: SideBar[] = [];
  public click(tab: SideBar, $event: MouseEvent) {
    this.tabs!.selectTab(tab.name, $event);
  }
  public mounted() {
    this.tabs = this.$refs.tabs as BaseTabs;
    this.items = this.tabs.$children as SideBar[];
  }
  public changed(tab: SideBar) {
    this.title = tab.name;
  }
}
</script>

<style scoped lang="sass">
</style>
<template>
  <div style="display: flex">
    
    <v-navigation-drawer
      permanent 
      mini-variant
      class="secondary-lighten-2"
      :style="style"
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

    <div class="aside secondary" style="display: flex; flex-direction: column">
      
      <div
        class="title center--vertial white--text"
        :style="`min-height: ${titleHeight + 1}px`"
      >
        <div>{{ title }}</div>
      </div>
      <vue-perfect-scrollbar class="scrollbar">
        <base-tabs ref="tabs" @changed="changed">
          <slot></slot>
        </base-tabs>
      </vue-perfect-scrollbar>
      
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';

@Component({ components: { SideBar, BaseTabs, VuePerfectScrollbar } })
export default class ActivityBar extends Vue {
  @Prop({ type: Number, default: 60 }) public activityBarWidth!: number;
  @Prop({ type: Number, default: 300 }) public sidePanelWidth!: number;
  @Prop({ type: Number, required: true }) public titleHeight!: number;
  @Prop({ type: Number, default: 0 }) public paddingBottom!: number;

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
  get style() {
    return {
      flex: `0 0 ${this.activityBarWidth}px`,
    };
  }
}
</script>

<style scoped lang="sass">
.aside
  height: 100%
  width: 100%
  z-index: 3
  border-right: 1px solid

.title
  font-size: 15px !important
  border-bottom: 1px solid rgba(0, 0, 0, 0.3)
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent
</style>
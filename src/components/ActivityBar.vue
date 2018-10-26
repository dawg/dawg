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

    <aside 
      class="aside secondary"
      :style="`left: ${activityBarWidth}px; width: ${sidePanelWidth}`"
    >
      
      <div 
        class="title center--vertial white--text"
        :style="`height: ${titleHeight + 1}px`"
      >
        <div>{{ title }}</div>
      </div>
      <base-tabs ref="tabs" @changed="changed">
        <slot></slot>
      </base-tabs>
      
    </aside>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';

@Component({ components: {SideBar, BaseTabs} })
export default class ActivityBar extends Vue {
  @Prop({ type: Number, default: 60 }) public activityBarWidth!: number;
  @Prop({ type: Number, default: 300 }) public sidePanelWidth!: number;
  @Prop({ type: Number, required: true }) public titleHeight!: number;

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
.aside
  height: 100%
  width: 300px
  position: fixed
  z-index: 3
  border-right: 1px solid

.title
  font-size: 15px !important
  border-bottom: 1px solid rgba(0, 0, 0, 0.3)
  padding: 0 20px
</style>
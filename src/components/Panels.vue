<template>
  <split class="secondary" direction="vertical">
    <split :initial="55" fixed>
      <ul class="tabs-headers" style="height: 55px">
        <li
          v-for="(tab, i) in items"
          :key="i" 
          :class="{ 'is-active': tab.isActive }"
          class="tabs-header"
        >
          <div @click="tabs.selectTab(tab.name, $event)" class="text white--text">{{ tab.name }}</div>
        </li>
      </ul>
    </split>
    <split>
      <base-tabs class="tabs-panels secondary" ref="tabs" style="height: auto">
        <slot></slot>
      </base-tabs>
    </split>
  </split>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import Split from '@/modules/split/Split.vue';

@Component({
  components: { Split, BaseTabs },
})
export default class Panels extends Vue {
  public tabs: BaseTabs | null = null;
  public mounted() {
    this.tabs = this.$refs.tabs as BaseTabs;
  }
  public get items() {
    if (!this.tabs) {
      return [];
    }

    return this.tabs.tabs;
  }
}
</script>

<style lang="sass" scoped>

</style>
<template>
  <div>
    <ul class="tabs-component-tabs">
      <li v-for="(tab, i) in tabs"
          :key="i" :class="{ 'is-active': tab.isActive }"
          class="tabs-component-tab">
        <span @click="selectTab(tab.hash, $event)" class="text">{{ tab.name }}</span>
        <v-icon size="13px" class="close-icon" @click="close(i)">close</v-icon>
      </li>
    </ul>
    <div class="tabs-component-panels">
      <slot/>
    </div>
  </div>
</template>

<script>
import * as expiringStorage from '../expiringStorage';

export default {
  name: 'Tabs',
  props: { cacheLifetime: { default: 5 } },

  data: () => ({
    tabs: [],
  }),

  computed: {
    storageKey() {
      return `vue-tabs-component.cache.${window.location.host}${window.location.pathname}`;
    },
  },

  mounted() {
    this.tabs = [...this.$children];
    const previousSelectedTabHash = expiringStorage.get(this.storageKey);

    if (this.findTab(previousSelectedTabHash)) {
      this.selectTab(previousSelectedTabHash);
    } else if (this.tabs.length) {
      this.selectTab(this.tabs[0].hash);
    }
  },

  methods: {
    findTab(hash) {
      return this.tabs.find(tab => tab.hash === hash);
    },

    selectTab(selectedTabHash, event) {
      if (event) {
        event.preventDefault();
      }

      const selectedTab = this.findTab(selectedTabHash);
      if (!selectedTab) {
        return;
      }

      // eslint-disable-next-line array-callback-return
      this.tabs.map((tab) => {
        // eslint-disable-next-line
        tab.isActive = (tab.hash === selectedTab.hash);
      });

      this.$emit('changed', { tab: selectedTab });

      expiringStorage.set(this.storageKey, selectedTab.hash, this.cacheLifetime);
    },
    close(i) {
      this.tabs[i].isActive = false;
      const tab = this.tabs[i + 1] || this.tabs[i - 1] || {};
      this.tabs.splice(i, 1);
      this.selectTab(tab.hash);
    },
  },
};
</script>

<style lang="sass" scoped>
  $border: #ddd

  .tabs-component-tabs
    border: 0
    padding: 0
    align-items: stretch
    display: flex
    justify-content: flex-start
    box-shadow: inset 0 -1px 0 $border

  .tabs-component-tab
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    background-color: #fff
    width: 150px
    text-align: center
    border-left: 1px solid $border
    box-shadow: inset 0 -1px 0 $border

    &.is-active
      color: #000
      box-shadow: unset

      &:last-of-type
        box-shadow: 1px 0 0 $border

      &:before
        content: ""
        position: absolute
        pointer-events: none
        z-index: 2
        top: 0
        left: -1px
        bottom: 0
        width: 3px
        background: #568af2

    &:hover .close-icon
      transform: scale(1)
      transition-duration: .16s


  .text
    align-items: center
    padding: .75em 1em
    text-decoration: none
    display: block

    &:hover
      cursor: default

  .tabs-component-panels
    background-color: #fff
    box-shadow: 0 0 10px rgba(0, 0, 0, .05)
    padding: 4em 2em

  .close-icon
    top: 0.75em
    right: 0.5em
    z-index: 2
    width: 1.5em
    height: 1.5em
    line-height: 1.5
    text-align: center
    border-radius: 3px
    overflow: hidden
    transform: scale(0)
    transition: transform .08s
    position: absolute

    &:hover
      cursor: pointer
      color: #001133
      background-color: #568af2
      transform: scale(1)
      transition-duration: .16s
</style>

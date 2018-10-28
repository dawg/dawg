<template>
  <div class="secondary">
    <ul class="tabs-headers">
      <li v-for="(tab, i) in tabs"
          :key="i" :class="{ 'is-active': tab.isActive }"
          class="tabs-header">
        <div @click="selectTab(tab.name, $event)" class="text white--text">{{ tab.name }}</div>
      </li>
    </ul>
    <div class="tabs-panels secondary">
      <slot/>
    </div>
  </div>
</template>


<script lang="ts">
import { Component } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';

@Component
export default class Panels extends BaseTabs { }
</script>

<style lang="sass" scoped>
.tabs-headers
  align-items: stretch
  display: flex
  padding: 0

.tabs-header
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
    text-align: center
    padding: .75em 1em

    &.is-active
      color: #000
      box-shadow: unset
      
      & .text
        border-bottom: 1px solid

.text
  align-items: center
  text-decoration: none
  display: inline-block
  padding: 0 2px

  &:hover
    cursor: default
</style>
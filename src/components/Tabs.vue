<template>
  <div class="secondary">
    <ul class="tabs-component-tabs">
      <li v-for="(tab, i) in tabs"
          :key="i" :class="{ 'is-active': tab.isActive }"
          class="tabs-component-tab">
        <span @click="selectTab(tab.name, $event)" class="text white--text">{{ tab.name }}</span>
        <v-icon size="13px" class="close-icon" color="white" @click="close(i)">close</v-icon>
      </li>
      <li class="tabs-component-tab remainder"></li>
    </ul>
    <div class="tabs-component-panels">
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';

@Component
export default class Tabs extends BaseTabs { }
</script>

<style lang="sass" scoped>
  $border: #111

  .tabs-component-tabs
    border: 0
    padding: 0
    align-items: stretch
    display: flex
    justify-content: flex-start

  .tabs-component-tab
    position: relative
    color: #999
    font-size: 14px
    font-weight: 600
    list-style: none
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

  .remainder
    flex-grow: 1
    border-left: none

  .text
    align-items: center
    padding: .75em 1em
    text-decoration: none
    display: block

    &:hover
      cursor: default

  .tabs-component-panels
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

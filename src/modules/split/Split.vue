<template>
    <div class="split">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import split from 'split.js';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { Parent, Direction, Child } from '@/modules/split/types';

@Component
export default class Split extends Vue implements Parent {
  @Prop({type: String, default: 'horizontal'}) public direction!: Direction;
  @Prop({type: Number, default: 8}) public gutterSize!: number;
  public elements: HTMLElement[] = [];
  public sizes: number[] = [];
  public minSizes: number[] = [];
  public instance: split.Instance | null = null;
  public $children!: Child[];
  public init() {
    if (this.instance) {
        this.instance.destroy();
    }

    this.instance = split(this.elements, {
      sizes: this.sizes,
      direction: this.direction,
      minSize: this.minSizes,
      gutterSize: this.gutterSize,
      cursor: this.direction === 'horizontal' ? 'col-resize' : 'row-resize',
      onDrag: () => {
        this.$emit('onDrag', this.instance!.getSizes());
      },
      onDragStart: () => {
        this.$emit('onDragStart', this.instance!.getSizes());
      },
      onDragEnd: () => {
        this.$emit('onDragEnd', this.instance!.getSizes());
      },
    });
  }
  public changeAreaSize() {
    this.sizes = [];
    this.minSizes = [];
    this.$children.forEach((vnode) => {
      this.sizes.push(vnode.size);
      this.minSizes.push(vnode.minSize);
    });
    this.init();
  }
  public reset() {
    this.init();
  }
  public getSizes() {
      return this.instance!.getSizes();
  }
  public mounted() {
    this.elements = this.$children.map((child) => child.$el);
    this.changeAreaSize();
  }

  @Watch('direction')
  public onDirectionChange() {
    this.init();
  }

  @Watch('gutterSize')
  public onGutterSizeChange() {
    this.init();
  }
}
</script>

<style>
.split {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  width: 100%;
}
.gutter {
  background-color: #eee;
  background-repeat: no-repeat;
  background-position: 50%;
}
.gutter.gutter-horizontal {
  cursor: col-resize;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
}
.gutter.gutter-vertical {
  cursor: row-resize;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
}
.split.split-horizontal, .gutter.gutter-horizontal {
  height: 100%;
  float: left;
}
</style>


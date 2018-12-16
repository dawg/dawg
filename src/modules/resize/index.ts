import throttle from 'lodash.throttle';
import ResizeObserver from 'resize-observer-polyfill';
import { Component, Vue } from 'vue-property-decorator';

export interface Directions {
  didHorizontal: boolean;
  didVertical: boolean;
}

@Component
export class ResponsiveMixin extends Vue {
  public width = 0;
  public height = 0;
  public mounted() {
    this.$nextTick(() => {
      const handleResize = throttle((entries) => {
        const cr = entries[0].contentRect;
        const didHorizontal = this.width !== cr.width;
        const didVertical = this.height !== cr.height;
        this.width = cr.width;
        this.height = cr.height;

        if (!didHorizontal && !didVertical) { return; }
        this.onResize({ didHorizontal, didVertical });
      }, 200);

      const observer = new ResizeObserver(handleResize);
      if (this.$el instanceof Element) {
        observer.observe(this.$el);
      } else {
        // tslint:disable-next-line:no-console
        console.warn('Not adding resize watcher');
      }
    });
  }
  public onResize(direction: Directions) {
    // TODO Can we make this abstract? Google abstract TypeScript Vue Mixin.
  }
}

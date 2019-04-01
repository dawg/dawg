import { Vue, Component } from 'vue-property-decorator';

@Component
export class Hover extends Vue {
  public hover = false;
  public $el!: HTMLElement;

  public mounted() {
    this.$el.addEventListener('mouseenter', this.hover_startHover);
    this.$el.addEventListener('mouseleave', this.hover_endHover);
  }

  public destroyed() {
    this.$el.removeEventListener('mouseenter', this.hover_startHover);
    this.$el.removeEventListener('mouseleave', this.hover_endHover);
  }

  public hover_startHover() {
    this.hover = true;
  }

  public hover_endHover() {
    this.hover = false;
  }
}

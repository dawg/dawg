import { Vue, Component, Prop } from 'vue-property-decorator';
import { makeLookup } from '@/utils';

@Component
export class TabParent extends Vue {
  public tabs: TabChild[] = [];
  public selected?: TabChild = undefined;

  get firstTab() {
    return this.tabs[0] || {};
  }
  get title() {
    if (!this.selected) { return; }
    return this.selected.name;
  }
  get tabLookup() {
    return makeLookup(this.tabs, (tab) => tab.name);
  }
  public mounted() {
    this.tabs = [...this.$children as TabChild[]];
    this.selectTab(this.firstTab.name);
  }
  public selectTab(name?: string, event?: MouseEvent) {
    if (event !== undefined) {
      event.preventDefault();
    }

    if (name === undefined) {
      return;
    }

    if (this.selected) {
      this.selected.isActive = false;
    }

    this.selected = this.tabLookup[name];
    this.selected.isActive = true;

    this.$emit('changed', this.selected);
  }
  public close(i: number) {
    this.tabs[i].isActive = false;
    const tab = this.tabs[i + 1] || this.tabs[i - 1] || {};
    this.tabs.splice(i, 1);
    this.selectTab(tab.name);
  }
}

// tslint:disable-next-line:max-classes-per-file
@Component
export class TabChild extends Vue {
  @Prop({ type: String, required: true }) public name!: string;
  public isActive = false;
}

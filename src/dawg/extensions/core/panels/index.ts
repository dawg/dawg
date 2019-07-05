import { manager } from '@/dawg/extensions/manager';
import { value, watch, Wrapper } from 'vue-function-api';

export const panels = manager.activate<{ openedPanel: string }, {}, {}, { openedPanel: Wrapper<string | undefined> }>({
  id: 'dawg.panels',
  activate(context) {
    const openedPanel = value(context.workspace.get('openedPanel'));

    watch(openedPanel, () => {
      if (openedPanel.value !== undefined) {
        context.workspace.set('openedPanel', openedPanel.value);
      }
    });

    return {
      openedPanel,
    };
  },
});

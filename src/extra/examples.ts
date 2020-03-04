import { createExtension } from '@/lib/framework';
import * as dawg from '@/dawg';
import StillDRE from '@/examples/Still DRE.json';
import { ProjectType } from '@/core/project';

const examples = {
  'Still DRE': StillDRE,
} as const;

export const extension = createExtension({
  id: 'dawg.examples',
  activate(context) {
    context.subscriptions.push(dawg.commands.registerCommand({
      text: 'Open Example',
      callback: () => {
        dawg.palette.selectFromObject(examples, {
          placeholder: 'Example Projects',
          onDidInput: (json) => {
            const result = dawg.io.decodeItem(ProjectType, json);
            if (result.type === 'error') {
              dawg.notify.error('Unable to parse example: ' + json.name, {
                detail: result.message,
                duration: Infinity,
              });
              return;
            }

            dawg.project.openTempProject(result.decoded);
          },
        });
      },
    }));
  },
});

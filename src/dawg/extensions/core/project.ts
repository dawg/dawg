import tmp from 'tmp';
import fs from 'mz/fs';
import { Sample, ScheduledSample } from '@/core';
import { Beats } from '@/core/types';
import { general } from '@/store';
import { IProject } from '@/store/project';
import { Extension, IExtensionContext } from '@/dawg/extensions';
// TODO(jacob) Wrap
import { remote } from 'electron';
import { manager } from '../manager';

class ProjectAPI {
  constructor(private context: IExtensionContext<{}, { tempProjectPath: string }>) {}

  public scheduleMaster(sample: Sample, row: number, time: Beats) {
    general.project.samples.push(sample);

    const scheduled = new ScheduledSample(sample, {
      type: 'sample',
      sampleId: sample.id,
      duration: sample.beats,
      row,
      time,
    });

    scheduled.schedule(general.project.master.transport);
    general.project.master.elements.push(scheduled);
  }

  public async openTempProject(p: IProject) {
    const { name } = tmp.fileSync({ keep: true });
    await fs.writeFile(name, JSON.stringify(p, null, 4));

    // dawg.log.info(`Writing ${name} as backup`);
    this.context.global.set('tempProjectPath', name);

    const window = remote.getCurrentWindow();
    window.reload();
  }

  public onDidSave(cb: (encoded: IProject) => void) {
    return {
      dispose() {
        // TODO(jacob)
      },
    };
  }

  public serializeProject() {
    return general.project.serialize();
  }

  public getProject() {
    return general.project;
  }
}

const extension: Extension<{}, { tempProjectPath: string }, {}, ProjectAPI> = {
  id: 'dawg.project',
  activate(context) {
    // TODO Loading from FS
    return new ProjectAPI(context);
  },

  deactivate() {
    //
  },
};

export const project = manager.activate(extension);

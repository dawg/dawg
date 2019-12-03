import fs from '@/fs';
import * as t from '@/modules/io';
import { PythonShell, Options } from 'python-shell';
import path from 'path';
import { manager } from '@/base/manager';
import { sampleViewer } from '@/dawg/extensions/core/sample-viewer';
import { busy } from '@/dawg/extensions/core/busy';
import { notify } from '@/dawg/extensions/core/notify';
import { ui } from '@/base/ui';

interface PythonError {
  type: 'error';
  message: string;
  details: string;
}

interface PythonSuccess {
  type: 'success';
  message: string;
  details: string;
}

interface PythonOptions {
  pythonPath: string | undefined;
  modelsPath: string | undefined;
  scriptPath: string | null;
  samplePath: string | null;
  cb: (result: PythonError | PythonSuccess) => void;
}

export async function runModel(opts: PythonOptions) {
  if (opts.pythonPath === undefined || !(await fs.exists(opts.pythonPath))) {
    opts.cb({
      type: 'error',
      message: 'Python Path Not Found',
      details: 'Please enter a valid python path in the project settings.',
    });

    return;
  }
  if (opts.modelsPath === undefined ||
      opts.scriptPath === null ||
      !(await fs.exists(path.join(opts.modelsPath, opts.scriptPath)))) {
    opts.cb({
      type: 'error',
      message: 'Models Path Not Found',
      details: 'Please enter a valid models repository path in the projects settings.',
    });

    return;
  }

  if (opts.samplePath !== null) {
    const options: Options = {
        mode: 'text',
        pythonPath: opts.pythonPath,
        scriptPath: opts.modelsPath,
        args: [opts.samplePath],
    };

    PythonShell.run(opts.scriptPath, options, (err?: Error) => {
      if (err) {
        return opts.cb({
          type: 'error',
          message: 'Unknown Error',
          details: err.message,
        });
      }

      opts.cb({
        type: 'success',
        message: 'Model Ran Successfully',
        details: 'Check the File Explorer for the model output.',
      });
    });
  } else {
    opts.cb({
      type: 'error',
      message: 'Sample File is Null',
      details: 'Please select a valid sample file.',
    });
  }
}

export const models = manager.activate({
  id: 'dawg.models',
  global: {
    modelsPath: {
      type: t.string,
      expose: true,
      definition: 'The path of the models.',
      label: 'Models Path',
    },
    pythonPath: {
      type: t.string,
      expose: true,
      definition: 'The path to your python environment.',
      label: 'Python Path',
    },
  },
  activate(context) {
    const modelsPath = context.global.modelsPath;
    const pythonPath = context.global.pythonPath;

    const createCallback = (scriptPath: string, notifyText: (samplePath: string) => string) => (samplePath: string) => {
      const provider = busy(notifyText(samplePath));

      runModel({
        pythonPath: pythonPath.value,
        modelsPath: modelsPath.value,
        scriptPath,
        samplePath,
        cb: (result) => {
          provider.dispose();
          if (result.type === 'error') {
            notify.error(result.message, {
              detail: result.details,
              duration: Infinity,
            });
          }

          if (result.type === 'success') {
            notify.success(result.message, {detail: result.details});
          }
        },
      });
    };

    context.subscriptions.push(sampleViewer.addAction({
      text: 'Separate',
      callback: createCallback(
        'vusic/separation/scripts/separate.py',
        (samplePath) => `Extracting vocals from ${path.basename(samplePath)}`,
      ),
    }));


    sampleViewer.addAction({
      text: 'Transcribe',
      callback: createCallback(
        'vusic/transcription/scripts/infer.py',
        (samplePath) => `Converting ${path.basename(samplePath)} to MIDI`,
      ),
    });

    ui.settings.push({
      type: 'string',
      value: pythonPath,
      title: 'Python Path',
      description: 'The path to your python interpreter',
    });

    ui.settings.push({
      type: 'string',
      value: modelsPath,
      title: 'Models Path',
      description: 'The path to the `models` repository',
    });

    return {
      modelsPath,
      pythonPath,
      runModel,
    };
  },
});

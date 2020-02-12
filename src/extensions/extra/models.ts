import fs from '@/lib/fs';
import * as t from '@/lib/io';
import { PythonShell, Options } from 'python-shell';
import path from 'path';
import { sampleViewer } from '@/extensions/core/sample-viewer';
import { busy } from '@/extensions/core/busy';
import { notify } from '@/extensions/core/notify';
import { createExtension } from '@/lib/framework/extensions';

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

    PythonShell.run(opts.scriptPath, options, (err) => {
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

export const extension = createExtension({
  id: 'dawg.models',
  global: {
    modelsPath: t.string,
    pythonPath: t.string,
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

    context.settings.push({
      type: 'string',
      value: pythonPath,
      label: 'Python Path',
      description: 'The path to your `python` interpreter.',
    });

    context.settings.push({
      type: 'string',
      value: modelsPath,
      label: 'Models Path',
      description: 'The path to the `models` repository.',
    });
  },
});

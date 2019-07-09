import fs from '@/wrappers/fs';
import { PythonShell, Options } from 'python-shell';
import path from 'path';
import { manager } from '../manager';
import { computed, Wrapper } from 'vue-function-api';
import { sampleViewer } from './sample-viewer';
import { busy } from './busy';
import { notify } from './notify';

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
  pythonPath: string | null;
  modelsPath: string | null;
  scriptPath: string | null;
  samplePath: string | null;
  cb: (result: PythonError | PythonSuccess) => void;
}

export async function runModel(opts: PythonOptions) {
  if (opts.pythonPath === null || !(await fs.exists(opts.pythonPath))) {
    opts.cb({
      type: 'error',
      message: 'Python Path Not Found',
      details: 'Please enter a valid python path in the project settings.',
    });

    return;
  }
  if (opts.modelsPath === null ||
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

// tslint:disable-next-line:interface-over-type-literal
type Global = { modelsPath: string, pythonPath: string };

interface API {
  modelsPath: Wrapper<string>;
  pythonPath: Wrapper<string>;
  runModel: (opts: PythonOptions) => void;
}

export const models = manager.activate<{}, Global, {}, API>({
  id: 'dawg.models',
  activate(context) {
    const modelsPath = computed(() => {
      return context.global.get('modelsPath', '');
    }, (value) => {
      context.global.set('modelsPath', value);
    });

    const pythonPath = computed(() => {
      return context.global.get('pythonPath', '');
    }, (value) => {
      context.global.set('pythonPath', value);
    });

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

    return {
      modelsPath,
      pythonPath,
      runModel,
    };
  },
});

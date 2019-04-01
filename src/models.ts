import fs from 'mz/fs';
import {PythonShell, Options} from 'python-shell';
import path from 'path';

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

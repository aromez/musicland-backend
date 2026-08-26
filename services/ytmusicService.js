const { spawn } = require('child_process');
const path = require('path');
const pLimit = require('p-limit');
const limit = pLimit(2); // ruhusu michakato 2 ya Python tu kwa wakati mmoja

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const SCRIPT_PATH = path.join(
  __dirname,
  '..',
  'python',
  'ytmusic_lookup.py'
);

function runPythonCommand(args) {
  return limit(() => {
    return new Promise((resolve, reject) => {
      const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, ...args]);

      let output = '';
      let errorOutput = '';
      let finished = false;

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          proc.kill();
          reject(new Error('Python process imechukua muda mrefu sana (timeout)'));
        }
      }, 25000); // sekunde 25

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);

        if (code !== 0) {
          return reject(new Error(`Python process ilitoka na code ${code}: ${errorOutput}`));
        }
        try {
          const parsed = JSON.parse(output);
          if (parsed.error) {
            return reject(new Error(parsed.error));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Imeshindikana ku-parse output ya Python: ${e.message}`));
        }
      });
    });
  });
}
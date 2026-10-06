import { runPython } from './python.mjs';

runPython(['-m', 'sales_trainer', ...process.argv.slice(2)]);

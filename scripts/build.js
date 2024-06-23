#!/usr/bin/env node

import * as generate from './lib/generate-types.js';
import { generateValidation } from './lib/generate-validator.js';
import compileTs from './lib/compile-ts.js';
import setExec from './lib/set-exec.js';

await Promise.all([generateValidation(), generate.schemas()]);

compileTs();

await setExec();

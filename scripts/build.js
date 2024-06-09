#!/usr/bin/env node

import generateTypes from './lib/generate-types.js';
import compileTs from './lib/compile-ts.js';
import copySchema from './lib/copy-schema.js';
import setExec from './lib/set-exec.js';

await generateTypes();
compileTs();

await Promise.all([copySchema(), setExec()]);

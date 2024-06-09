#!/usr/bin/env node

import { rm } from 'node:fs/promises';

await Promise.all([
	rm('./.jest', { recursive: true, force: true }),
	rm('./dist', { recursive: true, force: true }),
	rm('./src/pull/*.schema.d.ts', { recursive: true, force: true })
]);

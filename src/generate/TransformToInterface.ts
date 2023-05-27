import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';

import type ExecutionContext from '../services/ExecutionContext.js';

export default async function TransformToInterface(
	ctx: ExecutionContext,
	jsonSchema: JSONSchema4
) {
	const result = await compile(jsonSchema, 'TODO');
	const resultPath = join(ctx.paths.workingDirectory, '/schema.d.ts');
	await writeFile(resultPath, result, 'utf-8');
}

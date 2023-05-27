import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AnySchema } from 'ajv';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

import type ExecutionContext from '../services/ExecutionContext.js';

export default async function TransformToValidation(
	ctx: ExecutionContext,
	schema: AnySchema
) {
	const ajv = new Ajv({
		code: { esm: true, source: true },
		schemas: [schema]
	});

	const code = standaloneCode(ajv);

	const codePath = join(ctx.paths.workingDirectory, 'validate.js');
	await writeFile(codePath, code, 'utf-8');
}

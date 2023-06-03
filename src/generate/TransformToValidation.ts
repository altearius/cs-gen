import type { AnySchema } from 'ajv';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

import type ExecutionContext from '../services/ExecutionContext.js';
import FormatAndSave from '../services/FormatAndSave.js';

export default async function TransformToValidation(
	ctx: ExecutionContext,
	schema: AnySchema
) {
	const ajv = new Ajv({
		code: { esm: true, source: true },
		schemas: [schema]
	});

	const compiled = ajv.compile(schema);
	const code = standaloneCode(ajv, compiled);

	await FormatAndSave(ctx, 'validate.js', 'babel', code);
}

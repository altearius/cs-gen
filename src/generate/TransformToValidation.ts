import type { AnySchema } from 'ajv';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

import type IOptions from '../models/IOptions.js';
import FormatAndSave from '../services/FormatAndSave.js';

export default async function TransformToValidation(
	options: IOptions,
	schema: AnySchema
) {
	const ajv = new Ajv({
		code: { esm: true, source: true },
		schemas: [schema]
	});

	const compiled = ajv.compile(schema);
	const code = standaloneCode(ajv, compiled);

	const { outputValidationCode: filepath } = options;
	if (typeof filepath !== 'string') {
		return;
	}

	await FormatAndSave(filepath, 'babel', code);
}

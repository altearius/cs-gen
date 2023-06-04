import { join } from 'node:path';

import type { SchemaObject } from 'ajv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';

import type IOptions from '../models/IOptions.js';
import FormatAndSave from '../services/FormatAndSave.js';

export default async function TransformToValidation(
	options: IOptions,
	jsonSchema: SchemaObject
) {
	const { validationPath } = options;
	if (typeof validationPath !== 'string') {
		return;
	}

	const schemas = extractDefinitions(jsonSchema);

	const ajv = new Ajv({
		code: { esm: true, source: true },
		schemas: [...schemas.values()]
	});

	addFormats(ajv);

	for (const [name, schema] of schemas) {
		console.log('Generating validation code:', name);
		const compiled = ajv.compile(schema);
		const code = standaloneCode(ajv, compiled);
		const filepath = join(validationPath, `${name}.js`);
		await FormatAndSave(filepath, 'babel', code);
	}
}

function extractDefinitions(schema: SchemaObject) {
	const { definitions } = schema;

	if (!isSchemaObject(definitions)) {
		throw new TypeError('Expected schema to have definitions');
	}

	return Object.entries(definitions).reduce((map, [name, schema]) => {
		// No point in validating meta types.
		if (name.includes('-')) {
			return map;
		}

		map.set(name, {
			$id: `#/definitions/${name}`,
			...(schema as SchemaObject)
		});

		return map;
	}, new Map<string, SchemaObject>());
}

function isSchemaObject(o: unknown): o is SchemaObject {
	return typeof o === 'object' && o !== null;
}

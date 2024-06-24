import type { SchemaObject } from 'ajv';
import Ajv, { MissingRefError } from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import c from 'ansi-colors';
import { join } from 'node:path';
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
		schemas: [...schemas.values()],
		verbose: true
	});

	addFormats(ajv);

	for (const [name, schema] of schemas) {
		// No point in validating certain types. These are all supplied by
		// Contentstack itself, and the user has no control to modify them.
		if (name.includes('-')) {
			continue;
		}

		const compiled = tryCompile(ajv, schema, name);
		if (!compiled) {
			continue;
		}

		const code = standaloneCode(ajv, compiled);
		const filepath = join(validationPath, `${name}.js`);
		await FormatAndSave(filepath, 'babel', code);
	}
}

function tryCompile(ajv: Ajv, schema: SchemaObject, name: string) {
	try {
		return ajv.compile(schema);
	} catch (ex: unknown) {
		if (ex instanceof MissingRefError) {
			console.error(
				c.redBright('⚠ Could not resolve'),
				c.yellowBright(ex.missingRef),
				c.redBright('from'),
				`${c.yellowBright(name)}${c.redBright('.')}`
			);
		}
	}
}

function extractDefinitions(schema: SchemaObject) {
	const { definitions } = schema;

	if (!isSchemaObject(definitions)) {
		throw new TypeError('Expected schema to have definitions');
	}

	return Object.entries(definitions).reduce((map, [name, schema]) => {
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

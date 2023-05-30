import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv from 'ajv';

import SchemaPath from './SchemaPath.js';

export async function BuildValidator<T>(schemaName: string) {
	const schemaPath = resolve(SchemaPath(), `${schemaName}.schema.json`);

	const rawSchema = await readFile(schemaPath, 'utf8');
	const parsed = JSON.parse(rawSchema) as unknown;
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	const ajv = new Ajv();
	return ajv.compile<T>(parsed);
}

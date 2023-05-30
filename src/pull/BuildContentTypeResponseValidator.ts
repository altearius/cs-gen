import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv from 'ajv';

import type { IGetAllContentTypesResponse } from './IGetAllContentTypesResponse';
import SchemaPath from './SchemaPath.js';

export async function BuildContentTypeResponseValidator() {
	const schemaPath = resolve(
		SchemaPath(),
		'GetAllContentTypesResponse.schema.json'
	);

	const rawSchema = await readFile(schemaPath, 'utf8');
	const parsed = JSON.parse(rawSchema) as unknown;
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	const ajv = new Ajv();
	return ajv.compile<IGetAllContentTypesResponse>(parsed);
}

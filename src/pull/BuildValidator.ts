import { readFile } from 'node:fs/promises';

import type { AnySchemaObject } from 'ajv';
import Ajv from 'ajv';

export async function BuildValidator<T>(schemaName: string) {
	const [schema, contentFieldSchema] = await Promise.all([
		readSchemaFile(schemaName),
		readContentFieldSchema()
	]);

	const ajv = new Ajv({
		discriminator: true,
		loadSchema: async (uri) => {
			if (uri === 'ContentField.schema.json') {
				return contentFieldSchema;
			}

			throw new Error(`Unknown schema: ${uri}`);
		}
	});

	return ajv.compileAsync<T>(schema);
}

async function readSchemaFile(name: string): Promise<AnySchemaObject> {
	const thisFileUrl = new URL(import.meta.url);
	const schemaName = `./${name}.schema.json`;
	const schemaUrl = new URL(schemaName, thisFileUrl);
	const raw = await readFile(schemaUrl, 'utf8');
	const parsed = JSON.parse(raw) as unknown;

	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	return parsed;
}

let contentFieldSchema: Promise<AnySchemaObject> | undefined;

async function readContentFieldSchema() {
	return (contentFieldSchema ??= readSchemaFile('ContentField'));
}

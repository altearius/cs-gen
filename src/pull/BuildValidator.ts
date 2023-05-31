import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { AnySchemaObject } from 'ajv';
import Ajv from 'ajv';

import SchemaPath from './SchemaPath.js';

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
	const schemaPath = resolve(SchemaPath(), `${name}.schema.json`);
	const raw = await readFile(schemaPath, 'utf8');
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

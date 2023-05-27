import { writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import S from 'fluent-json-schema';

import type ExecutionContext from '../services/ExecutionContext.js';

import IsContentstackContentType from './IsContentstackContentType.js';

export default async function TransformToJsonSchema(
	ctx: ExecutionContext,
	contents: ReadonlyMap<string, string | undefined>
) {
	const contentstackSchema = resolveContentstackSchema(contents);
	const builder = S.object();
	const schemaPath = join(ctx.paths.workingDirectory, `schema.json`);

	for (const contentType of contentstackSchema) {
		const def = S.object();
		def.additionalProperties(false);

		for (const field of contentType.schema) {
			def.prop(field.uid, fieldSchemaFor());
		}

		builder.definition(contentType.uid, def);
	}

	console.warn(
		'TODO: transform',
		contentstackSchema.length,
		'content types to JSON schema'
	);

	const jsonSchema = builder.valueOf();

	await writeFile(schemaPath, JSON.stringify(jsonSchema, null, 2), 'utf-8');

	return jsonSchema;
}

function resolveContentstackSchema(
	contents: ReadonlyMap<string, string | undefined>
) {
	for (const [key, value] of contents.entries()) {
		if (basename(key) !== 'schema.json') {
			continue;
		}

		if (value === undefined) {
			throw new Error('schema.json has no content');
		}

		const parsed = JSON.parse(value) as unknown;
		if (!Array.isArray(parsed)) {
			throw new Error('schema.json is not an array');
		}

		if (!parsed.every(IsContentstackContentType)) {
			throw new Error('schema.json contains invalid content types');
		}

		return parsed;
	}

	throw new Error('Could not find schema.json');
}

function fieldSchemaFor() {
	return S.string();
}

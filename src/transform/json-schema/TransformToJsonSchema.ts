import type { SchemaObject } from 'ajv';
import S from 'fluent-json-schema';

import type IContentType from '../../models/IContentType.js';
import type IOptions from '../../models/IOptions.js';
import FormatAndSave from '../../services/FormatAndSave.js';

import SchemaCollection from './SchemaCollection.js';
import SchemaWalker from './SchemaWalker.js';

type ITypeCollection = ReadonlyMap<string, IContentType>;

export default async function TransformToJsonSchema(
	options: IOptions,
	contentTypes: ITypeCollection,
	globalTypes: ITypeCollection
): Promise<SchemaObject> {
	const jsonSchema = generateJsonSchema(contentTypes, globalTypes);
	await saveJsonSchema(options, jsonSchema);
	return jsonSchema;
}

function generateJsonSchema(
	contentTypes: ITypeCollection,
	globalTypes: ITypeCollection
) {
	const collection = new SchemaCollection(contentTypes, globalTypes);
	const walker = new SchemaWalker(collection);

	const jsonSchema = [...walker].reduce(
		(top, [uid, schema]) => top.definition(uid, schema),
		S.object()
	);

	return jsonSchema.valueOf();
}

async function saveJsonSchema(
	{ jsonSchemaPath }: IOptions,
	jsonSchema: SchemaObject
) {
	if (typeof jsonSchemaPath !== 'string') {
		return;
	}

	const value = JSON.stringify(jsonSchema);
	await FormatAndSave(jsonSchemaPath, 'json', value);
}

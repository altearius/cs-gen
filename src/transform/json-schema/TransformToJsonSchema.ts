import S from 'fluent-json-schema';

import type IContentType from '../../models/IContentType.js';
import type IOptions from '../../models/IOptions.js';
import FormatAndSave from '../../services/FormatAndSave.js';

import SchemaCollection from './SchemaCollection.js';
import SchemaWalker from './SchemaWalker.js';

export default async function TransformToJsonSchema(
	options: IOptions,
	contentTypes: ReadonlySet<IContentType>
) {
	const jsonSchema = generateJsonSchema(contentTypes);
	await saveJsonSchema(options, jsonSchema);
	return jsonSchema;
}

function generateJsonSchema(contentTypes: ReadonlySet<IContentType>) {
	const collection = new SchemaCollection(contentTypes);
	const walker = new SchemaWalker(collection);

	const jsonSchema = [...walker].reduce(
		(top, [uid, schema]) => top.definition(uid, schema),
		S.object()
	);

	return jsonSchema.valueOf();
}

async function saveJsonSchema(
	{ outputJsonSchema: filepath }: IOptions,
	jsonSchema: unknown
) {
	if (typeof filepath !== 'string') {
		return;
	}

	const value = JSON.stringify(jsonSchema);
	await FormatAndSave(filepath, 'json', value);
}

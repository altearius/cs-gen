import S from 'fluent-json-schema';

import type IContentType from '../../models/IContentType.js';
import type ExecutionContext from '../../services/ExecutionContext.js';
import FormatAndSave from '../../services/FormatAndSave.js';

import SchemaCollection from './SchemaCollection.js';
import SchemaWalker from './SchemaWalker.js';

export default async function TransformToJsonSchema(
	ctx: ExecutionContext,
	contentTypes: ReadonlySet<IContentType>
) {
	const jsonSchema = generateJsonSchema(contentTypes);

	await FormatAndSave(
		ctx,
		'ContentTypes.schema.json',
		'json',
		JSON.stringify(jsonSchema)
	);

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

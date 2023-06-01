import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import S from 'fluent-json-schema';

import type IContentType from '../../models/IContentType.js';
import type ExecutionContext from '../../services/ExecutionContext.js';

import SchemaCollection from './SchemaCollection.js';
import SchemaWalker from './SchemaWalker.js';

export default async function TransformToJsonSchema(
	ctx: ExecutionContext,
	contentTypes: ReadonlySet<IContentType>
) {
	const outputPath = join(
		ctx.paths.workingDirectory,
		'ContentTypes.schema.json'
	);

	const collection = new SchemaCollection(contentTypes);
	const walker = new SchemaWalker(collection);

	const jsonSchema = [...walker].reduce((top, [uid, schema]) => {
		return top.definition(uid, schema);
	}, S.object());

	const final = jsonSchema.valueOf();

	await writeFile(outputPath, JSON.stringify(final, null, 2), 'utf8');
	return final;
}

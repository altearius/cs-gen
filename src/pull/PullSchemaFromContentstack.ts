import type IContentType from '../models/IContentType.js';
import type ExecutionContext from '../services/ExecutionContext.js';
import FormatAndSave from '../services/FormatAndSave.js';

import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields from './GetGlobalFields.js';

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
): Promise<ReadonlySet<IContentType>> {
	const contentTypesPromise = GetContentTypes(ctx);
	const globalsPromise = GetGlobalFields(ctx);

	const saveContentTypes = saveResponse(
		ctx,
		contentTypesPromise,
		'content-types.json'
	);

	const saveGlobals = saveResponse(ctx, globalsPromise, 'global-fields.json');

	const [types, globals] = await Promise.all([
		contentTypesPromise,
		globalsPromise
	]);

	const map = [...types, ...globals].reduce((map, type) => {
		if (map.has(type.uid)) {
			throw new Error(`Duplicate content type UID: ${type.uid}`);
		}

		map.set(type.uid, type);
		return map;
	}, new Map<string, IContentType>());

	await Promise.all([saveContentTypes, saveGlobals]);
	return new Set(map.values());
}

async function saveResponse(
	ctx: ExecutionContext,
	responsePromise: Promise<unknown>,
	name: string
) {
	const value = JSON.stringify(await responsePromise);
	await FormatAndSave(ctx, name, 'json', value);
}

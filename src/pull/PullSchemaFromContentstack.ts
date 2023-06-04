import { join } from 'node:path';

import type IContentType from '../models/IContentType.js';
import type IOptions from '../models/IOptions.js';
import FormatAndSave from '../services/FormatAndSave.js';

import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields from './GetGlobalFields.js';

export default async function PullSchemaFromContentstack(
	options: IOptions
): Promise<{
	readonly contentTypes: ReadonlyMap<string, IContentType>;
	readonly globalTypes: ReadonlyMap<string, IContentType>;
}> {
	const contentTypesPromise = GetContentTypes(options);
	const globalsPromise = GetGlobalFields(options);

	const saveContentTypes = saveResponse(
		options,
		contentTypesPromise,
		'content-types.json'
	);

	const saveGlobals = saveResponse(
		options,
		globalsPromise,
		'global-fields.json'
	);

	const [types, globals] = await Promise.all([
		contentTypesPromise,
		globalsPromise
	]);

	const contentTypes = indexByUid(types);
	const globalTypes = indexByUid(globals);
	await Promise.all([saveContentTypes, saveGlobals]);

	return { contentTypes, globalTypes };
}

async function saveResponse(
	{ responsePath }: IOptions,
	responsePromise: Promise<unknown>,
	name: string
) {
	if (typeof responsePath !== 'string') {
		return;
	}

	const filepath = join(responsePath, name);
	const value = JSON.stringify(await responsePromise);
	await FormatAndSave(filepath, 'json', value);
}

function indexByUid<T extends { readonly uid: string }>(
	list: readonly T[]
): ReadonlyMap<string, T> {
	return list.reduce((map, item) => {
		if (map.has(item.uid)) {
			throw new Error(`Duplicate content type UID: ${item.uid}`);
		}

		map.set(item.uid, item);
		return map;
	}, new Map<string, T>());
}

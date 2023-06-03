import { join } from 'node:path';

import type IContentType from '../models/IContentType.js';
import type IOptions from '../models/IOptions.js';
import FormatAndSave from '../services/FormatAndSave.js';

import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields from './GetGlobalFields.js';

export default async function PullSchemaFromContentstack(
	options: IOptions
): Promise<ReadonlySet<IContentType>> {
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

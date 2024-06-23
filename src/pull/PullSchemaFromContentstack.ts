import { join } from 'node:path';
import { ContentType } from '../models/ContentType.schema.yaml';
import type IOptions from '../models/IOptions.js';
import FormatAndSave from '../services/FormatAndSave.js';
import { CreateClient } from './CreateClient.js';
import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields, { GlobalField } from './GetGlobalFields.js';

export default async function PullSchemaFromContentstack(
	options: IOptions
): Promise<{
	readonly contentTypes: ReadonlyMap<string, ContentType>;
	readonly globalTypes: ReadonlyMap<string, GlobalField>;
}> {
	const client = CreateClient(options);
	const contentTypesPromise = GetContentTypes(client);
	const globalsPromise = GetGlobalFields(client);

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

	const filter = options.filter ?? (() => true);
	const contentTypes = indexByUid(filter, types);
	const globalTypes = indexByUid(filter, globals);
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
	filter: (uid: string) => boolean,
	list: readonly T[]
): ReadonlyMap<string, T> {
	return list.reduce((map, item) => {
		if (!filter(item.uid)) {
			return map;
		}

		if (map.has(item.uid)) {
			throw new Error(`Duplicate content type UID: ${item.uid}`);
		}

		map.set(item.uid, item);
		return map;
	}, new Map<string, T>());
}

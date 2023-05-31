import type ExecutionContext from '../services/ExecutionContext.js';

import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema.js';
import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields from './GetGlobalFields.js';

type IContentType = IGetAllContentTypesResponse['content_types'][number];

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
): Promise<ReadonlySet<IContentType>> {
	const [types, globals] = await Promise.all([
		GetContentTypes(ctx),
		GetGlobalFields(ctx)
	]);

	const map = new Map<string, IContentType>();

	for (const type of types) {
		map.set(type.uid, type);
	}

	for (const global of globals) {
		map.set(global.uid, global);
	}

	console.log('known types', map.keys());

	return new Set(map.values());
}

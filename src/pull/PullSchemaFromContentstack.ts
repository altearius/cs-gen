import type IContentType from '../models/IContentType.js';
import type ExecutionContext from '../services/ExecutionContext.js';

import GetContentTypes from './GetContentTypes.js';
import GetGlobalFields from './GetGlobalFields.js';

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
): Promise<ReadonlySet<IContentType>> {
	const [types, globals] = await Promise.all([
		GetContentTypes(ctx),
		GetGlobalFields(ctx)
	]);

	const map = [...types, ...globals].reduce((map, type) => {
		if (map.has(type.uid)) {
			throw new Error(`Duplicate content type UID: ${type.uid}`);
		}

		map.set(type.uid, type);
		return map;
	}, new Map<string, IContentType>());

	return new Set(map.values());
}
